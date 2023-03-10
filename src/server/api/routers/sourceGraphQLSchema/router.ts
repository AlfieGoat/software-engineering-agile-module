import {
  mergeTypeDefs,
  printWithComments,
} from "@graphql-toolkit/schema-merging";
import { TRPCError } from "@trpc/server";
import { getDiff } from "graphql-schema-diff";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { validateAndParseGraphQLSchema } from "../graphQLSubset/graphQL";
import { mergeSchemas } from "../product/graphQL";

export const sourceGraphQLSchemaRouter = createTRPCRouter({
  create: protectedProcedure
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

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const sourceGraphQLSchema = await ctx.prisma.sourceGraphQLSchema.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return sourceGraphQLSchema;
  }),

  compareLatestSourceGraphQLSchemaWithSubsets: protectedProcedure.query(
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
});
