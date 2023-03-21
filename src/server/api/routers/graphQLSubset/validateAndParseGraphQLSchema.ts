import { TRPCError } from "@trpc/server";
import { buildASTSchema, parse, type DocumentNode } from "graphql";

export const validateAndParseGraphQLSchema = (graphQLSchema: string) => {
  let parsedGraphQLSchema: DocumentNode;
  try {
    parsedGraphQLSchema = parse(graphQLSchema);
    buildASTSchema(parsedGraphQLSchema);
  } catch (e) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The schema that was supplied was invalid.",
      cause: e,
    });
  }
  return parsedGraphQLSchema;
};
