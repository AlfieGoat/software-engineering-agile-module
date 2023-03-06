import { z } from "zod";

import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";

export const productRouter = createTRPCRouter({
  create: protectedAdminProcedure
    .input(
      z.object({
        graphQLSchema: z.string(),
        name: z.string().min(5).max(80),
        description: z.string().min(1).max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { graphQLSchema, name, description } = input;

      const subset = await ctx.prisma.graphQLSubset.create({
        data: { graphQLSchema, name, description},
      });

      return subset;
    }),

  // getById: protectedAdminProcedure
  //   .input(z.object({ productId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     const product = await ctx.prisma.product.findUnique({
  //       where: { id: input.productId },
  //     });

  //     return product;
  //   }),
});
