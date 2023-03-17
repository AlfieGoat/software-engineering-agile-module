import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";
import { updateProduct } from "../product/graphQL";
import { validateAndParseGraphQLSchema } from "./graphQL";

import {
  ArgumentNode,
  ASTKindToNode,
  ASTNode,
  ASTVisitor,
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
  ObjectFieldNode,
  OperationDefinitionNode,
  parse,
  print,
  TypeNode,
  visit,
} from "graphql";
import produce from "immer";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const NAME_SCHEMA = z.string().min(4).max(80);
const DESCRIPTION_SCHEMA = z.string().min(1).max(1000);

export const graphQLSubsetRouter = createTRPCRouter({
  create: protectedAdminProcedure
    .input(
      z.object({
        graphQLSchema: z.string(),
        name: NAME_SCHEMA,
        description: DESCRIPTION_SCHEMA,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { graphQLSchema, name, description } = input;

      validateAndParseGraphQLSchema(graphQLSchema);

      const subset = await ctx.prisma.graphQLSubset.create({
        data: { graphQLSchema, name, description },
      });

      return subset;
    }),

  getById: protectedAdminProcedure
    .input(z.object({ graphQLSubsetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const graphQLSubset = await ctx.prisma.graphQLSubset.findUnique({
        where: { id: input.graphQLSubsetId },
      });

      return graphQLSubset;
    }),

  getAll: protectedAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(MAX_PAGE_SIZE).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? DEFAULT_PAGE_SIZE;
      const { cursor } = input;
      const items = await ctx.prisma.graphQLSubset.findMany({
        take: limit + 1, // get an extra item at the end which we'll use as next cursor
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "asc",
        },
        include: { products: true },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }
      return {
        items,
        nextCursor,
      };
    }),

  updateById: protectedAdminProcedure
    .input(
      z.object({
        graphQLSubsetId: z.string(),
        editedGraphQLSubset: z.object({
          graphQLSchema: z.string(),
          name: NAME_SCHEMA,
          description: DESCRIPTION_SCHEMA,
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldGraphQLSubset = await ctx.prisma.graphQLSubset.findUniqueOrThrow(
        {
          where: { id: input.graphQLSubsetId },
          include: { products: { include: { subsets: true } } },
        }
      );

      validateAndParseGraphQLSchema(input.editedGraphQLSubset.graphQLSchema);

      const products = oldGraphQLSubset.products;

      return await ctx.prisma.$transaction(async (tx) => {
        const graphQLSubset = await ctx.prisma.graphQLSubset.update({
          where: { id: input.graphQLSubsetId },
          data: {
            graphQLSchema: input.editedGraphQLSubset.graphQLSchema,
            name: input.editedGraphQLSubset.name,
            description: input.editedGraphQLSubset.description,
          },
        });

        await Promise.all(
          products.map((product) =>
            updateProduct(
              {
                editedProduct: {
                  graphQLSubsets: product.subsets.map((subset) => ({
                    id: subset.id,
                  })),
                  description: product.description,
                  name: product.name,
                },
                productId: product.id,
              },
              tx
            )
          )
        );

        return graphQLSubset;
      });
    }),

  deleteById: protectedAdminProcedure
    .input(
      z.object({
        graphQLSubsetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const graphQLSubset = await ctx.prisma.graphQLSubset.findUniqueOrThrow({
        where: { id: input.graphQLSubsetId },
        include: { products: true },
      });

      if (graphQLSubset.products.length > 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You cannot delete a GraphQLSubset that is still associated with products.",
        });

      await ctx.prisma.graphQLSubset.delete({
        where: { id: input.graphQLSubsetId },
      });
    }),

  extractMinimumGraphQLSchemaFromQuery: protectedAdminProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { query } = input;

      const sourceGraphQLSchema =
        await ctx.prisma.sourceGraphQLSchema.findFirst({
          orderBy: { createdAt: "desc" },
        });

      if (!sourceGraphQLSchema)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to find the latest Source GraphQL Schema.",
        });

      const parsedSourceGraphQLSchema = validateAndParseGraphQLSchema(
        sourceGraphQLSchema.graphQLSchema
      );

      const parsedQuery = parse(query);

      // 1. Collect all field paths and input object types
      const { usedFields } = collectUsedFieldsAndInputTypes(parsedQuery);

      console.log(JSON.stringify({ usedFields }));

      // 2. Create the allowList
      const [fieldAllowList, argumentAllowList] = produceAllowList(
        parsedSourceGraphQLSchema,
        usedFields
      );

      // 4. Prune the schema
      const prunedSchema = pruneSchema(
        parsedSourceGraphQLSchema,
        fieldAllowList,
        argumentAllowList
      );
      // console.log(print(prunedSchema));
      return print(prunedSchema);
    }),
});

function traverseQueryFields(node: ASTNode, usedFields: ValidPathNode[][]) {
  // Define the logic for different types of AST nodes
  const visitor: ASTVisitor = {
    Field: {
      enter(fieldNode, key, parent, path, ancestors) {
        let fullPath = getFullPath(ancestors, fieldNode);
        usedFields.push(fullPath);
      },
    },
    ObjectField: {
      enter(fieldNode, key, parent, path, ancestors) {
        let fullPath = getFullPath(ancestors, fieldNode);
        usedFields.push(fullPath);
      },
    },
    Argument: {
      enter(fieldNode, key, parent, path, ancestors) {
        let fullPath = getFullPath(ancestors, fieldNode);
        usedFields.push(fullPath);
      },
    },
  };

  // Visit the parsed query with the custom visitor
  visit(node, visitor);
}

const VALID_ANCESTOR_NODES = [
  "OperationDefinition",
  "Field",
  "Argument",
  "ObjectField",
  "InlineFragment",
  "Name",
  "EnumValue",
];

const ANCESTORS_TO_IGNORE = ["SelectionSet", "Document", "ObjectValue"];

type FieldPathsNodes = FieldNode | OperationDefinitionNode | InlineFragmentNode;

type ArgumentPathNodes =
  | ObjectFieldNode
  | ArgumentNode
  | FieldNode
  | OperationDefinitionNode
  | InlineFragmentNode;

type ValidPathNode = ArgumentPathNodes | FieldPathsNodes;

function getFullPath(
  ancestors: ReadonlyArray<
    | ASTKindToNode[keyof ASTKindToNode]
    | ReadonlyArray<ASTKindToNode[keyof ASTKindToNode]>
  >,
  node: ObjectFieldNode | FieldNode | ArgumentNode
) {
  let fullPath: Array<ValidPathNode> = [];

  ancestors.forEach((ancestor) => {
    if (Array.isArray(ancestor)) return;
    if (ANCESTORS_TO_IGNORE.includes((ancestor as any).kind)) return;
    if (!VALID_ANCESTOR_NODES.includes((ancestor as any).kind))
      throw new Error(
        `Ancestor was incorrect kind, found: ${(ancestor as any).kind}.`
      );
    fullPath.push(ancestor as any);
  });
  if (!VALID_ANCESTOR_NODES.includes(node.kind))
    throw new Error(`Node was incorrect kind, found: ${node.kind}`);
  fullPath.push(node);
  return fullPath;
}

function produceAllowList(schema: DocumentNode, usedFields: ValidPathNode[][]) {
  const fieldAllowList: Record<string, Field[]> = {};

  const argumentAllowList: Record<string, Argument[]> = {};

  function isArgument(field: ValidPathNode[]): field is ArgumentPathNodes[] {
    return field.some((ancestor) => ancestor.kind === "Argument");
  }

  usedFields.forEach((field) => {
    if (isArgument(field)) {
      const allowListInfo = getArgumentAllowListInfo(field, schema);
      if (allowListInfo.type === "field") {
        if (fieldAllowList[allowListInfo.parentType]) {
          fieldAllowList[allowListInfo.parentType]?.push(allowListInfo);
        } else {
          fieldAllowList[allowListInfo.parentType] = [allowListInfo];
        }
        return;
      }
      if (argumentAllowList[allowListInfo.parentType]) {
        argumentAllowList[allowListInfo.parentType]?.push(allowListInfo);
      } else {
        argumentAllowList[allowListInfo.parentType] = [allowListInfo];
      }
    } else {
      const allowListInfo = getFieldAllowListInfo(field, schema);
      if (fieldAllowList[allowListInfo.parentType]) {
        fieldAllowList[allowListInfo.parentType]?.push(allowListInfo);
      } else {
        fieldAllowList[allowListInfo.parentType] = [allowListInfo];
      }
    }
  });

  console.log(JSON.stringify({ fieldAllowList, argumentAllowList }, null, 4));
  return [fieldAllowList, argumentAllowList];
}

// function getTypeNameByFieldPath(path: string[], schema: DocumentNode) {
//   path.reduce(()=>{

//   }, {previousPathType: "Query"})
// }

interface Argument {
  type: "Argument";
  parentType: string;
  fieldName: string;
  argumentName: string;
  fieldType: string;
}

interface Field {
  type: "field";
  parentType: string;
  fieldName: string;
  fieldType: string;
}

const getArgumentAllowListInfo = (
  field: ArgumentPathNodes[],
  schema: DocumentNode
): Argument | Field => {
  const queryObjectTypeDefinition = schema.definitions.find(
    (definition) =>
      definition.kind === "ObjectTypeDefinition" &&
      definition.name.value === "Query"
  )!;

  if (queryObjectTypeDefinition.kind !== "ObjectTypeDefinition")
    throw new Error("Query Type Definition is not the correct kind");

  const initialState: Argument = {
    type: "Argument",
    parentType: "",
    fieldType: getOperation(field),
    fieldName: "",
    argumentName: "",
  };

  const reducer = (
    state: Argument,
    currentNode: ArgumentPathNodes,
    currentIndex: number,
    array: ArgumentPathNodes[]
  ): Argument => {
    if (!state.fieldType || currentNode.kind === "Argument") return state;

    const pathType = schema.definitions.find((definition) => {
      if (
        definition.kind !== "ObjectTypeDefinition" &&
        definition.kind !== "InterfaceTypeDefinition" &&
        definition.kind !== "UnionTypeDefinition" &&
        definition.kind !== "InputObjectTypeDefinition"
      )
        return false;
      return definition.name.value === state.fieldType;
    });

    if (
      pathType?.kind !== "ObjectTypeDefinition" &&
      pathType?.kind !== "InterfaceTypeDefinition" &&
      pathType?.kind !== "InputObjectTypeDefinition"
    )
      throw new Error(`${pathType} is not of type ObjectTypeDefinition`);

    const nextNode = array[currentIndex + 1];

    if (
      nextNode &&
      nextNode.kind === "Argument" &&
      array.length === currentIndex + 1
    ) {
      return {
        argumentName: nextNode.name.value,
        fieldName: currentNode.name.value as string,
        type: "Argument",
        fieldType: "",
        parentType: state.fieldType,
      };
    }

    if (nextNode && nextNode.kind === "Argument") {
      // get argumentType, this should be nextPathType
      const field = pathType.fields?.find(
        (field) => field.name.value === currentNode.name.value
      );
      const argument = field?.arguments?.find(
        (argument) => argument.name.value === nextNode.name.value
      );
      if (!argument) throw new Error("Couldn't find argument");
      const argumentType = resolveRootType(argument.type);

      return {
        argumentName: nextNode.name.value,
        type: "Argument",
        parentType: state.fieldType,
        fieldType: argumentType,
        fieldName: "",
      };
    }

    let nextPathType: TypeNode | undefined;

    switch (currentNode.kind) {
      case "Field":
        nextPathType = pathType.fields?.find((field) => {
          return field.name.value! === currentNode.name.value;
        })?.type;
        break;
      case "InlineFragment":
        nextPathType = currentNode.typeCondition;
        break;
      case "ObjectField":
        return {
          fieldType: "",
          parentType: state.fieldType,
          fieldName: currentNode.name.value,
          type: "Argument",
          argumentName: "",
        };
      case "OperationDefinition":
        throw new Error("Unexpected OperationDefinition");
    }

    if (!nextPathType) throw new Error(`nextPathType is falsy!`);

    const resolvedType = resolveRootType(nextPathType);

    switch (currentNode.kind) {
      case "Field":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: currentNode.name.value,
          type: "Argument",
          argumentName: "",
        };
      case "InlineFragment":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: "", // InlineFragment don't have field names
          type: "Argument",
          argumentName: "",
        };
    }
  };

  const fieldAllowListInformation = field
    .slice(1)
    .reduce<Argument>(reducer, initialState);

  // if (!fieldAllowListInformation.fieldType)
  //   throw new Error("fieldType is falsy!");

  if (fieldAllowListInformation.argumentName === "")
    return {
      ...fieldAllowListInformation,
      type: "field",
    };
  return fieldAllowListInformation;
};

const getFieldAllowListInfo = (
  field: FieldPathsNodes[],
  schema: DocumentNode
): Field => {
  const queryObjectTypeDefinition = schema.definitions.find(
    (definition) =>
      definition.kind === "ObjectTypeDefinition" &&
      definition.name.value === "Query"
  )!;

  if (queryObjectTypeDefinition.kind !== "ObjectTypeDefinition")
    throw new Error("Query Type Definition is not the correct kind");

  const initialState: Field = {
    type: "field",
    parentType: "",
    fieldType: getOperation(field),
    fieldName: "",
  };

  const reducer = (state: Field, currentField: FieldPathsNodes): Field => {
    const pathType = schema.definitions.find((definition) => {
      if (
        definition.kind !== "ObjectTypeDefinition" &&
        definition.kind !== "InterfaceTypeDefinition" &&
        definition.kind !== "UnionTypeDefinition"
      )
        return false;
      return definition.name.value === state.fieldType;
    });

    if (
      pathType?.kind !== "ObjectTypeDefinition" &&
      pathType?.kind !== "InterfaceTypeDefinition"
    )
      throw new Error(`${pathType} is not of type ObjectTypeDefinition!`);

    let nextPathType: TypeNode | undefined;

    switch (currentField.kind) {
      case "Field":
        nextPathType = pathType.fields?.find((field) => {
          return field.name.value! === currentField.name.value;
        })?.type;
        break;
      case "InlineFragment":
        nextPathType = currentField.typeCondition;
        break;
      case "OperationDefinition":
        throw new Error("Unexpected OperationDefinition");
    }

    if (!nextPathType) throw new Error(`nextPathType is falsy!`);

    const resolvedType = resolveRootType(nextPathType);

    switch (currentField.kind) {
      case "Field":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: currentField.name.value,
          type: "field",
        };
      case "InlineFragment":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: "", // InlineFragment don't have field names
          type: "field",
        };
    }
  };

  const fieldAllowListInformation = field
    .slice(1)
    .reduce<Field>(reducer, initialState);

  if (!fieldAllowListInformation.fieldType)
    throw new Error("fieldType is falsy!");
  return fieldAllowListInformation;
};

// Helper function a: collectUsedFieldsAndInputTypes
function collectUsedFieldsAndInputTypes(parsedQuery: DocumentNode) {
  const usedFields: ValidPathNode[][] = [];

  traverseQueryFields(parsedQuery, usedFields);

  return { usedFields };
}

// Helper function c: pruneSchema
function pruneSchema(
  parsedSourceGraphQLSchema: DocumentNode,
  allowList: Record<string, Field[]>,
  argumentAllowList: Record<string, Argument[]>
) {
  const prunedSchema = produce(parsedSourceGraphQLSchema, (draft) => {
    // Filter out definitions not in the allow list
    draft.definitions = draft.definitions.filter((definition) => {
      if (
        definition.kind === "ObjectTypeDefinition" ||
        definition.kind === "InputObjectTypeDefinition" ||
        definition.kind === "InterfaceTypeDefinition"
      ) {
        return Boolean(allowList[definition.name.value]);
      }
      return true;
    });

    // Remove fields not in the allow list
    draft.definitions.forEach((definition) => {
      if (
        definition.kind === "ObjectTypeDefinition" ||
        definition.kind === "InterfaceTypeDefinition"
      ) {
        definition.fields = definition.fields?.filter((field) => {
          const typeAllowListInformation = allowList[definition.name.value];
          if (!typeAllowListInformation) return false;
          return typeAllowListInformation.some(
            (item) => field.name.value === item.fieldName
          );
        });
      } else if (definition.kind === "InputObjectTypeDefinition") {
        definition.fields = definition.fields?.filter((field) => {
          const typeAllowListInformation = allowList[definition.name.value];
          if (!typeAllowListInformation) return false;
          return typeAllowListInformation.some(
            (item) => field.name.value === item.fieldName
          );
        });
      }
    });

    // Remove arguments from fields
    draft.definitions.forEach((definition) => {
      if (
        definition.kind === "ObjectTypeDefinition" ||
        definition.kind === "InterfaceTypeDefinition"
      ) {
        definition.fields?.forEach((field) => {
          const parentTypeAllowListInformation =
            argumentAllowList[definition.name.value];
          if (!parentTypeAllowListInformation) return false;

          field.arguments = field.arguments?.filter((argument) =>
            parentTypeAllowListInformation.some(
              (allowedItem) => allowedItem.argumentName === argument.name.value
            )
          );
        });
      } else if (definition.kind === "InputObjectTypeDefinition") {
        definition.fields = definition.fields?.filter((field) => {
          const typeAllowListInformation = allowList[definition.name.value];
          if (!typeAllowListInformation) return false;
          return typeAllowListInformation.some(
            (item) => field.name.value === item.fieldName
          );
        });
      }
    });
  });

  return prunedSchema;
}

const resolveRootType = (type: TypeNode): string => {
  switch (type.kind) {
    case "ListType":
      return resolveRootType(type.type);
    case "NonNullType":
      return resolveRootType(type.type);
    case "NamedType":
      return type.name.value;
    default:
      throw new Error(`Failed to resolve type: , ${JSON.stringify(type)}`);
  }
};

const getOperation = (field: ValidPathNode[]) => {
  const topLevelAncestor = field[0];
  if (topLevelAncestor?.kind !== "OperationDefinition")
    throw new Error("Top level ancestor was not operation definition");
  switch (topLevelAncestor.operation) {
    case "query":
      return "Query";
    case "mutation":
      return "Mutation";
    case "subscription":
      return "Subscription";
  }
};
