import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";
import updateProduct from "../product/updateProduct";
import { validateAndParseGraphQLSchema } from "./validateAndParseGraphQLSchema";

import { parse, print } from "graphql";
import { collectLeafPaths } from "./collectLeafPaths/collectLeafPaths";
import { type ValidPathNode } from "./collectLeafPaths/getPathsToLeaves";
import { produceAllowList } from "./produceAllowList/produceAllowList";
import { pruneSchema } from "./pruneSchema/pruneSchema";

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
        query: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { graphQLSchema, name, description, query } = input;

      validateAndParseGraphQLSchema(graphQLSchema);

      const subset = await ctx.prisma.graphQLSubset.create({
        data: { graphQLSchema, name, description, query },
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
        filterText: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? DEFAULT_PAGE_SIZE;
      const { cursor, filterText } = input;
      const items = await ctx.prisma.graphQLSubset.findMany({
        take: limit + 1, // get an extra item at the end which we'll use as next cursor
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "asc",
        },
        include: { products: true },
        ...(filterText
          ? {
              where: {
                OR: [
                  { name: { contains: filterText } },
                  {
                    description: { contains: filterText },
                  },
                ],
              },
            }
          : {}),
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
          query: z.string(),
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
            query: input.editedGraphQLSubset.query,
          },
        });

        await Promise.all(
          products.map((product) =>
            updateProduct.updateProduct(
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

      // 1. Collect all paths to leaves
      const leafPaths: ValidPathNode[][] = [];

      collectLeafPaths(parsedQuery, leafPaths);

      // 2. Create the allowList
      const [fieldAllowList, argumentAllowList] = produceAllowList(
        parsedSourceGraphQLSchema,
        leafPaths
      );

      // 4. Prune the schema
      const prunedSchema = pruneSchema(
        parsedSourceGraphQLSchema,
        fieldAllowList,
        argumentAllowList
      );
      return print(prunedSchema);
    }),
});
