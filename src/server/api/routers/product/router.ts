import { printWithComments } from "@graphql-toolkit/schema-merging";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { mergeSchemas, updateProduct } from "./graphQL";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export const NAME_SCHEMA = z.string().min(4).max(80);
const DESCRIPTION_SCHEMA = z.string().min(1).max(1000);

export const UpdateProductInputSchema = z.object({
  productId: z.string(),
  editedProduct: z.object({
    description: DESCRIPTION_SCHEMA,
    graphQLSubsets: z.array(z.object({ id: z.string() })).min(1),
    name: NAME_SCHEMA,
  }),
});

export const productRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        description: DESCRIPTION_SCHEMA,
        name: NAME_SCHEMA,
        graphQLSubsets: z.array(z.object({ id: z.string() })).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const graphQLSubsets = await ctx.prisma.graphQLSubset.findMany({
        where: {
          id: {
            in: input.graphQLSubsets.map((graphQLSubset) => graphQLSubset.id),
          },
        },
      });

      const mergedSchemas = mergeSchemas(graphQLSubsets);
      const mergedSchemasSdl = printWithComments(mergedSchemas);

      const product = await ctx.prisma.product.create({
        data: {
          description: input.description,
          name: input.name,
          graphQLSchema: mergedSchemasSdl,
          subsets: { connect: input.graphQLSubsets },
        },
      });

      return product;
    }),

  getById: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        include: { subsets: true,customers: true },
      });

      return product;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(MAX_PAGE_SIZE).nullish(),
        cursor: z.string().nullish(), // <-- "cursor" needs to exist, but can be any type
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? DEFAULT_PAGE_SIZE;
      const { cursor } = input;
      const items = await ctx.prisma.product.findMany({
        take: limit + 1, // get an extra item at the end which we'll use as next cursor
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "asc",
        },
        include: { subsets: true, customers: true },
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

  updateById: protectedProcedure
    .input(UpdateProductInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await updateProduct(input, ctx.prisma);
    }),

  deleteById: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUniqueOrThrow({
        where: { id: input.productId },
        include: { customers: true },
      });

      if (product.customers.length > 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You cannot delete a Product that is still associated with Customers.",
        });

      await ctx.prisma.product.delete({
        where: { id: input.productId },
      });
    }),
});
