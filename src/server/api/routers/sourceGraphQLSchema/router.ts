import {
  mergeTypeDefs,
  printWithComments,
} from "@graphql-toolkit/schema-merging";
import { TRPCError } from "@trpc/server";
import { DocumentNode, print, SelectionNode, TypeNode } from "graphql";
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

      validateAndParseGraphQLSchema(graphQLSchema);

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
        printWithComments(mergeTypeDefs([sourceGraphQLSchema.graphQLSchema]))
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

      const parsedQuery = validateAndParseGraphQLSchema(query);
      // console.log(JSON.stringify(parsedQuery));
      // console.log(validate(buil))

      // console.log(JSON.stringify(parsedQuery), "\n\n\n");

      // console.log(JSON.stringify(parsedSourceGraphQLSchema));

      // const usedArguments: Set<string> = new Set();

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

        // if (kind === 'Field') {
        //   const fieldName = name.value;
        //   const fieldPath = path ? `${path}.${fieldName}` : fieldName;
        //   paths.push(fieldPath);
        //   getFieldPaths(node.selectionSet, fieldPath, paths);
        // } else if (kind === 'SelectionSet') {
        //   for (const selection of selections) {
        //     getFieldPaths(selection, path, paths);
        //   }
        // }

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

      // parsedQuery.definitions.forEach((definition) => {
      //   if (definition.kind === "OperationDefinition") {
      //     definition.selectionSet.selections.forEach((selection) => {
      //       if (selection.kind === "Field") {
      //         usedFields.add(selection.name.value);
      //         if (selection.selectionSet) {
      //           selection.selectionSet.selections.forEach((nestedSelection) => {
      //             if (nestedSelection.kind === "Field") {
      //               usedFields.add(
      //                 `${selection.name.value}.${nestedSelection.name.value}`
      //               );
      //             }
      //           });
      //         }
      //         if (selection.arguments && selection.arguments.length > 0) {
      //           selection.arguments.forEach((arg) => {
      //             usedArguments.add(
      //               `${selection.name.value}.${arg.name.value}`
      //             );
      //           });
      //         }
      //       }
      //     });
      //   }
      // });

      // console.log(usedFields);

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

      // console.log(allowList, "\n-------");

      const prunedSchema = produce((draft) => {
        let definitionAllowLists: string[] = [];
        draft.definitions.forEach((definition) => {
          switch (definition.kind) {
            case "ObjectTypeDefinition":
              if (Object.keys(allowList).includes(definition.name.value))
                definitionAllowLists.push(definition.name.value);
              break;
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
        draft.definitions = draft.definitions.filter((definition) => {
          if (
            definition.kind !== "ObjectTypeDefinition" &&
            definition.kind !== "SchemaDefinition"
          )
            throw new TRPCError({ code: "BAD_REQUEST" });
          return (
            definition.kind === "SchemaDefinition" ||
            definitionAllowLists.includes(definition.name.value)
          );
        });

        draft.definitions.forEach((definition, definitionIndex) => {
          switch (definition.kind) {
            case "ObjectTypeDefinition":
              definition.fields = definition.fields?.filter((field) =>
                Object.keys(allowList[definition.name.value]!).includes(
                  field.name.value
                )
              );

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
      }, parsedSourceGraphQLSchema);

      // console.log(print(prunedSchema(parsedSourceGraphQLSchema)));

      validateAndParseGraphQLSchema(
        print(prunedSchema(parsedSourceGraphQLSchema))
      );

      return print(prunedSchema(parsedSourceGraphQLSchema));
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
