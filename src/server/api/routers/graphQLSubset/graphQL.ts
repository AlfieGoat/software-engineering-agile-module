import { TRPCError } from "@trpc/server";
import { buildASTSchema, buildSchema, DocumentNode, parse, validateSchema } from "graphql";

export const validateAndParseGraphQLSchema = (graphQLSchema: string) => {
  let parsedGraphQLSchema: DocumentNode;
  try {
    parsedGraphQLSchema = parse(graphQLSchema);
    buildASTSchema(parsedGraphQLSchema);

    // console.log(JSON.stringify(parsedGraphQLSchema));
    // console.log("querytype", builtSchema.getQueryType())

    // console.log(validateSchema(builtSchema));
  } catch (e) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The schema that was supplied was invalid.",
      cause: e,
    });
  }
  return parsedGraphQLSchema;
};
