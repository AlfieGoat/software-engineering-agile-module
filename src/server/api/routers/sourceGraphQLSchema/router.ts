import { printWithComments } from "@graphql-toolkit/schema-merging";
import { TRPCError } from "@trpc/server";
import { parse } from "graphql";
import { getDiff } from "graphql-schema-diff";
import { z } from "zod";

import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";
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

      console.log(parse(graphQLSchema));

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
      ) as string;

      const schemaDiff = await getDiff(
        sourceGraphQLSchema.graphQLSchema,
        allGraphQLSubsetsMergedSdl
      );

      return schemaDiff;
    }
  ),
});
