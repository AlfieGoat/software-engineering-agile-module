import {
  printWithComments
} from "@graphql-toolkit/schema-merging";
import { TRPCError } from "@trpc/server";
import { DocumentNode, parse, print, SelectionNode, SelectionSetNode, TypeNode, ValueNode } from "graphql";
import { getDiff } from "graphql-schema-diff";
import produce from "immer";
import { z } from "zod";

import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";
import { validateAndParseGraphQLSchema } from "../graphQLSubset/graphQL";
import { mergeSchemas } from "../product/graphQL";

export const sourceGraphQLSchemaRouter = createTRPCRouter({
  create: protectedAdminProcedure
    .input(
      z.object({
        graphQLSchema: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { graphQLSchema } = input;

      // console.log(composeAndValidate([{name: "Subgraph", typeDefs: parse(graphQLSchema) }]))

      console.log(parse(graphQLSchema))

      // validateAndParseGraphQLSchema(graphQLSchema);

      const sourceGraphQLSchema = await ctx.prisma.sourceGraphQLSchema.create({
        data: {
          graphQLSchema,
        },
      });

      return sourceGraphQLSchema;
    }),

  getLatest: protectedAdminProcedure.query(async ({ ctx }) => {
    const sourceGraphQLSchema = await ctx.prisma.sourceGraphQLSchema.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return sourceGraphQLSchema;
  }),

  compareLatestSourceGraphQLSchemaWithSubsets: protectedAdminProcedure.query(
    async ({ ctx }) => {
      const sourceGraphQLSchema =
        await ctx.prisma.sourceGraphQLSchema.findFirst({
          orderBy: { createdAt: "desc" },
        });

      if (!sourceGraphQLSchema)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to find the latest Source GraphQL Schema.",
        });

      const allGraphQLSubsets = await ctx.prisma.graphQLSubset.findMany({});

      const allGraphQLSubsetsMerged = mergeSchemas(allGraphQLSubsets);
      const allGraphQLSubsetsMergedSdl = printWithComments(
        allGraphQLSubsetsMerged
      );

      const schemaDiff = await getDiff(
        allGraphQLSubsetsMergedSdl,
        sourceGraphQLSchema.graphQLSchema
      );

      return schemaDiff;
    }
  ),

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

      console.log(query)

      const parsedQuery = parse(query);

      console.log(JSON.stringify(parsedQuery))

      function getFieldPaths(
        nodes: readonly SelectionNode[],
        path: string = "",
        paths: string[] = []
      ): string[] {
        nodes.forEach((node) => {
          if (node.kind === "Field") {
            const newPath = `${path}${path === "" ? "" : "."}${
              node.name.value
            }`;

            paths.push(newPath);
            if (node.selectionSet)
              getFieldPaths(node.selectionSet.selections, newPath, paths);
          } else if (node.kind === "FragmentSpread") {
            const newPath = `${path}${path === "" ? "" : "."}${
              node.name.value
            }`;

            paths.push(newPath);
          } else if (node.kind === "InlineFragment") {
            if (node.selectionSet)
              getFieldPaths(node.selectionSet.selections, path, paths);
          }
        });

        return paths;
      }

      if (parsedQuery.definitions.length > 1)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Query definitions exceeded 1.",
        });

      const definition = parsedQuery.definitions[0];

      if (definition?.kind !== "OperationDefinition")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Parsed query had incorrect definition type",
        });

      const usedFields: string[] = getFieldPaths(
        definition.selectionSet.selections
      );

      const allowList: { [key: string]: { [key: string]: string } } = {};

      usedFields.forEach((field) => {
        const typeInformationByField = getTypeNameByFieldPath(
          field,
          parsedSourceGraphQLSchema
        );
        allowList[typeInformationByField.fieldParentType] = {
          ...allowList[typeInformationByField.fieldParentType],
          [typeInformationByField.fieldName]: typeInformationByField.fieldType,
        };
      });

      const prunedSchema = produce((draft) => {
        let definitionAllowLists: string[] = [];
        draft.definitions.forEach((definition) => {
          switch (definition.kind) {
            case "ObjectTypeDefinition":
              if (Object.keys(allowList).includes(definition.name.value))
                definitionAllowLists.push(definition.name.value);
              break;
            case "InputObjectTypeDefinition":
              console.log(definition.name.value)
            case "EnumTypeDefinition":
              console.log("EnumTypeDefinition", definition.name.value)
            case "UnionTypeDefinition":
              console.log("UnionTypeDefinition", definition.name.value)
            case "InterfaceTypeDefinition":
              console.log("InterfaceTypeDefinition", definition.name.value)
            case "ScalarTypeDefinition":
              console.log("ScalarTypeDefinition", definition.name.value)
            case "SchemaDefinition":
              break;
            default:
              throw new Error(
                `Encountered unexpected definition kind: ${
                  definition.kind
                }\nDefinition: ${JSON.stringify(definition)}`
              );
          }
        });

        // Definition filtering
        draft.definitions = draft.definitions.filter((definition) => {
          switch (definition.kind) {
            case "ObjectTypeDefinition":
              return definitionAllowLists.includes(definition.name.value)
            case "InputObjectTypeDefinition":
              console.log(definition.name.value)
              return true;
            case "EnumTypeDefinition":
              console.log("EnumTypeDefinition", definition.name.value)
              return true;
            case "UnionTypeDefinition":
              console.log("UnionTypeDefinition", definition.name.value)
              return true;
            case "InterfaceTypeDefinition":
              console.log("InterfaceTypeDefinition", definition.name.value)
              return true;
            case "ScalarTypeDefinition":
              console.log("ScalarTypeDefinition", definition.name.value)
              return true;
            case "SchemaDefinition":
              return true;
            default:
              throw new Error(
                `Encountered unexpected definition kind: ${
                  definition.kind
                }\nDefinition: ${JSON.stringify(definition)}`
              );
          }
        });

        // field filtering
        draft.definitions.forEach((definition, definitionIndex) => {
          switch (definition.kind) {
            case "ObjectTypeDefinition":
              definition.fields = definition.fields?.filter((field) =>
                Object.keys(allowList[definition.name.value]!).includes(
                  field.name.value
                )
              );

          }
        });
      }, parsedSourceGraphQLSchema);


      // validateAndParseGraphQLSchema(
      //   print(prunedSchema(parsedSourceGraphQLSchema))
      // );

      return print(prunedSchema(parsedSourceGraphQLSchema));
    }),

    extractMinimumGraphQLSchemaFromQuery2: protectedAdminProcedure
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
    const { usedFields, usedInputTypes } = collectUsedFieldsAndInputTypes(parsedQuery);

    console.log(usedFields, usedInputTypes);

    // 2. Create the allowList
    const allowList = createAllowList(usedFields, parsedSourceGraphQLSchema);

    // 3. Add used input object types, enum types, union types, interface types, and scalar types to the allowList
    addUsedInputTypesToAllowList(usedInputTypes, allowList, parsedSourceGraphQLSchema);

    // 4. Prune the schema
    const prunedSchema = pruneSchema(parsedSourceGraphQLSchema, allowList);

    return print(prunedSchema);
  }),
});

const getTypeNameByFieldPath = (
  field: string,
  schema: DocumentNode
): {
  fieldParentType: string;
  fieldType: string;
  fieldName: string;
} => {
  const pathSplit = field.split(".");

  const queryObjectTypeDefinition = schema.definitions.find(
    (definition) =>
      definition.kind === "ObjectTypeDefinition" &&
      definition.name.value === "Query"
  )!;

  let pathIndex = -1;
  let previousPathType: string = "";
  let currentPathType: string = "";
  while (pathIndex < pathSplit.length - 1) {
    pathIndex++;
    if (pathIndex === 0) {
      if (queryObjectTypeDefinition.kind !== "ObjectTypeDefinition")
        throw new Error("Query Type Definition is not the correct kind");
      const nextPathType = queryObjectTypeDefinition.fields?.find(
        (field) => field.name.value === pathSplit[pathIndex]
      )?.type;
      if (!nextPathType) throw new Error("nextPathType is falsy!");

      previousPathType = "Query";
      currentPathType = resolveRootType(nextPathType);

      continue;
    }

    const pathType = schema.definitions.find((definition) => {
      if (definition.kind !== "ObjectTypeDefinition") return false;
      return definition.name.value === currentPathType;
    });

    if (pathType?.kind !== "ObjectTypeDefinition")
      throw new Error(`${pathType} is not of type ObjectTypeDefinition`);

    const nextPathType = pathType.fields?.find((field) => {
      return field.name.value! === pathSplit[pathIndex];
    });

    if (!nextPathType) throw new Error(`nextPathType is falsy!`);

    previousPathType = currentPathType;
    currentPathType = resolveRootType(nextPathType.type);
  }
  const finalFieldName = pathSplit[pathSplit.length - 1];
  if (!finalFieldName) throw new Error("finalFieldName is falsy!");

  return {
    fieldParentType: previousPathType,
    fieldType: currentPathType,
    fieldName: finalFieldName,
  };
};

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


async function traverseInputQuery(
  nodes: readonly SelectionNode[],
  parentType: string,
  schema: DocumentNode,
  operationType: 'Query' | 'Mutation'
): Promise<string[]> {
  const usedTypes: string[] = [];

  for (const node of nodes) {
    if (node.kind === 'Field') {
      const typeInfo = getTypeNameByFieldPath(`${parentType}.${node.name.value}`, schema);
      usedTypes.push(`${typeInfo.fieldParentType}.${typeInfo.fieldName}`);

      if (node.arguments) {
        for (const arg of node.arguments) {
          const argType = getArgumentType(arg, schema);
          if (argType) {
            usedTypes.push(argType);
          }
        }
      }

      if (node.selectionSet) {
        const fieldUsedTypes = await traverseInputQuery(
          node.selectionSet.selections,
          typeInfo.fieldType,
          schema,
          operationType
        );
        usedTypes.push(...fieldUsedTypes);
      }
    } else if (node.kind === 'FragmentSpread') {
      const fragmentName = node.name.value;
      const fragmentDefinition = getFragmentDefinition(fragmentName, schema);
      if (fragmentDefinition) {
        const fragmentUsedTypes = await traverseInputQuery(
          fragmentDefinition.selectionSet.selections,
          fragmentDefinition.typeCondition.name.value,
          schema,
          operationType
        );
        usedTypes.push(...fragmentUsedTypes);
      }
    } else if (node.kind === 'InlineFragment') {
      const inlineFragmentType = node.typeCondition?.name.value || parentType;
      if (node.selectionSet) {
        const inlineFragmentUsedTypes = await traverseInputQuery(
          node.selectionSet.selections,
          inlineFragmentType,
          schema,
          operationType
        );
        usedTypes.push(...inlineFragmentUsedTypes);
      }
    }
  }

  return usedTypes;
}

function collectUsedFieldsAndInputTypes(
  parsedQuery: DocumentNode
): { usedFields: string[]; usedInputTypes: Set<string> } {
  const usedFields: string[] = [];
  const usedInputTypes = new Set<string>();

  function traverseSelectionSet(
    selectionSet: SelectionSetNode,
    path: string = "",
    inputTypePath: string = ""
  ) {
    selectionSet.selections.forEach((selection) => {
      if (selection.kind === "Field") {
        const newPath = path === "" ? selection.name.value : `${path}.${selection.name.value}`;
        usedFields.push(newPath);

        if (selection.arguments) {
          selection.arguments.forEach((arg) => {
            if (arg.value.kind === "ObjectValue") {
              traverseInputValues(arg.value, inputTypePath, usedInputTypes);
            }
          });
        }

        if (selection.selectionSet) {
          traverseSelectionSet(selection.selectionSet, newPath, inputTypePath);
        }
      } else if (selection.kind === "InlineFragment") {
        if (selection.selectionSet) {
          traverseSelectionSet(selection.selectionSet, path, inputTypePath);
        }
      } else if (selection.kind === "FragmentSpread") {
        // Handle fragment spreads
      }
    });
  }

  traverseSelectionSet(parsedQuery.definitions[0].selectionSet);
  return { usedFields, usedInputTypes };
}

function traverseInputValues(
  valueNode: ValueNode,
  inputTypePath: string,
  usedInputTypes: Set<string>
) {
  if (valueNode.kind === "ObjectValue") {
    valueNode.fields.forEach((field) => {
      const fieldInputTypePath = inputTypePath === "" ? field.name.value : `${inputTypePath}.${field.name.value}`;
      usedInputTypes.add(fieldInputTypePath);

      if (field.value.kind === "ObjectValue" || field.value.kind === "ListValue") {
        traverseInputValues(field.value, fieldInputTypePath, usedInputTypes);
      }
    });
  } else if (valueNode.kind === "ListValue") {
    valueNode.values.forEach((listValue) => {
      if (listValue.kind === "ObjectValue" || listValue.kind === "ListValue") {
        traverseInputValues(listValue, inputTypePath, usedInputTypes);
      }
    });
  }
}


// async function extractMinimumGraphQLSchemaFromQuery({ ctx, input }): Promise<string> {
//   const { query } = input;

//   const sourceGraphQLSchema = await ctx.prisma.sourceGraphQLSchema.findFirst({
//     orderBy: { createdAt: 'desc' },
//   });

//   if (!sourceGraphQLSchema)
//     throw new TRPCError({
//       code: 'NOT_FOUND',
//       message: 'Failed to find the latest Source GraphQL Schema.',
//     });

//   const parsedSourceGraphQLSchema = validateAndParseGraphQLSchema(sourceGraphQLSchema.graphQLSchema);
//   const parsedQuery = parse(query);

//   const operationDefinition = parsedQuery.definitions.find((definition) => definition.kind === 'OperationDefinition');
//   if (!operationDefinition)
//     throw new TRPCError({
//       code: 'BAD_REQUEST',
//       message: 'Parsed query had incorrect definition type',
//     });

//   const usedTypes = await traverseInputQuery(
//     operationDefinition.selectionSet.selections,
//     operationDefinition.operation === 'query' ? 'Query' : 'Mutation',
//     parsedSourceGraphQLSchema,
//     operationDefinition.operation
//   );

//   const allowList: { [key: string]: { [key: string]: string } } = {};

//   usedTypes.forEach((typePath) => {
//     const typeInfo = getTypeNameByFieldPath(typePath, parsedSourceGraphQLSchema);
//     if (!allowList[typeInfo.fieldParentType]) {
//       allowList[typeInfo.fieldParentType] = {};
//     }
//     allowList[typeInfo.fieldParentType][typeInfo.fieldName] = typeInfo.fieldType;
//   });

//   const prunedSchema = produce((draft) => {
//     draft.definitions = draft.definitions.filter((definition) => {
//       if (definition.kind === 'ObjectTypeDefinition') {
//         return Object.keys(allowList).includes(definition.name.value
//           );
// } else if (definition.kind === 'InputObjectTypeDefinition') {
// return isInputTypeUsed(definition.name.value, allowList);
// } else if (definition.kind === 'EnumTypeDefinition') {
// return isEnumTypeUsed(definition.name.value, allowList);
// } else if (definition.kind === 'UnionTypeDefinition') {
// return isUnionTypeUsed(definition.name.value, allowList);
// } else if (definition.kind === 'InterfaceTypeDefinition') {
// return isInterfaceTypeUsed(definition.name.value, allowList);
// } else if (definition.kind === 'ScalarTypeDefinition') {
// return isScalarTypeUsed(definition.name.value, allowList);
// } else if (definition.kind === 'SchemaDefinition') {
// return true;
// } else {
// throw new Error(
// `Encountered unexpected definition kind: ${definition.kind}\nDefinition: ${JSON.stringify(definition)}`
// );
// }
// });