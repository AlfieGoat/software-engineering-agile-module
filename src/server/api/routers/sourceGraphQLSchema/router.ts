import { printWithComments } from "@graphql-toolkit/schema-merging";
import { TRPCError } from "@trpc/server";
import { getDiff } from "graphql-schema-diff";
import { z } from "zod";

import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";
import { mergeSchemas } from "../product/mergeSchemas";

export const sourceGraphQLSchemaRouter = createTRPCRouter({
  create: protectedAdminProcedure
    .input(
      z.object({
        graphQLSchema: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { graphQLSchema } = input;

      const sourceGraphQLSchema = await ctx.prisma.$transaction(async (tx) => {
        const oldGraphQLSchema = await tx.sourceGraphQLSchema.findFirst({
          orderBy: { createdAt: "desc" },
        });

        if (oldGraphQLSchema) {
          await tx.sourceGraphQLSchema.delete({
            where: { id: oldGraphQLSchema?.id },
          });
        }

        const sourceGraphQLSchema = await tx.sourceGraphQLSchema.create({
          data: {
            graphQLSchema,
          },
        });

        return sourceGraphQLSchema;
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

      if (allGraphQLSubsets.length === 0) return "No GraphQL Subsets have been defined.";

      const allGraphQLSubsetsMerged = mergeSchemas(allGraphQLSubsets);
      const allGraphQLSubsetsMergedSdl = printWithComments(
        allGraphQLSubsetsMerged
      ) as string;

      const schemaDiff = await getDiff(
        sourceGraphQLSchema.graphQLSchema,
        allGraphQLSubsetsMergedSdl
      );

      return schemaDiff?.breakingChanges.map(
        (change) => `+++${change.description.split(" ")[0]!} \n`
      );
    }
  ),
});
