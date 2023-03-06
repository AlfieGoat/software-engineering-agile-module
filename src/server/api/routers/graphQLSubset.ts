import { z } from "zod";

import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const NAME_SCHEMA = z.string().min(5).max(80);
const DESCRIPTION_SCHEMA = z.string().min(1).max(1000).optional();

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
      await ctx.prisma.graphQLSubset.findUniqueOrThrow({
        where: { id: input.graphQLSubsetId },
      });

      const graphQLSubset = await ctx.prisma.graphQLSubset.update({
        where: { id: input.graphQLSubsetId },
        data: {
          graphQLSchema: input.editedGraphQLSubset.graphQLSchema,
          name: input.editedGraphQLSubset.name,
          description: input.editedGraphQLSubset.graphQLSchema,
        },
      });

      return graphQLSubset;
    }),

  deleteById: protectedAdminProcedure
    .input(
      z.object({
        graphQLSubsetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.graphQLSubset.findUniqueOrThrow({
        where: { id: input.graphQLSubsetId },
      });

      await ctx.prisma.graphQLSubset.delete({
        where: { id: input.graphQLSubsetId },
      });
    }),
});
