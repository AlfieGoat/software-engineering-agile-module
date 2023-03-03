import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const productRouter = createTRPCRouter({
  productCreate: protectedProcedure
    .input(z.object({ graphQLSchema: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.create({
        data: { name: input.name, graphQLSchema: input.graphQLSchema },
      });

      return product;
    }),

  productById: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
      });

      return product;
    }),

  productsAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(), // <-- "cursor" needs to exist, but can be any type
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      const { cursor } = input;
      const items = await ctx.prisma.product.findMany({
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

  productEdit: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        editedProduct: z.object({
          graphQLSchema: z.string(),
          name: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.update({
        where: { id: input.productId },
        data: {
          graphQLSchema: input.editedProduct.graphQLSchema,
          name: input.editedProduct.name,
        },
      });

      return product;
    }),

  productDeleteById: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.product.delete({
        where: { id: input.productId },
      });
    }),
});
