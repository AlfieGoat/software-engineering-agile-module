import { mergeTypeDefs } from "@graphql-toolkit/schema-merging";
import { GraphQLSubset } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { DocumentNode } from "graphql";

export const mergeSchemas = (graphQLSubsets: GraphQLSubset[]): DocumentNode => {
  try {
    const mergedSchema = mergeTypeDefs(
      graphQLSubsets.map((graphQLSubset) => graphQLSubset.graphQLSchema)
    );
    return mergedSchema;
  } catch (e) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: e as string,
    });
  }
};
