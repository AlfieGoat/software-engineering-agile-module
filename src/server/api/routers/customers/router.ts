import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const NAME_SCHEMA = z.string().min(4).max(80);
const DESCRIPTION_SCHEMA = z.string().min(1).max(1000).optional();

export const customerRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: NAME_SCHEMA,
        description: DESCRIPTION_SCHEMA,
        productId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, name, description } = input;

      const customer = await ctx.prisma.customer.create({
        data: {
          name,
          description,
          product: { connect: { id: productId } },
        },
      });

      return customer;
    }),

  getById: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.prisma.customer.findUnique({
        where: { id: input.customerId },
      });

      return customer;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(MAX_PAGE_SIZE).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? DEFAULT_PAGE_SIZE;
      const { cursor } = input;
      const items = await ctx.prisma.customer.findMany({
        take: limit + 1, // get an extra item at the end which we'll use as next cursor
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "asc",
        },
        include: { product: true },
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
    .input(
      z.object({
        customerId: z.string(),
        editedCustomer: z.object({
          name: NAME_SCHEMA,
          description: DESCRIPTION_SCHEMA,
          productId: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, description, productId } = input.editedCustomer;

      const customer = await ctx.prisma.customer.update({
        data: { name, description, product: { connect: { id: productId } } },
        where: { id: input.customerId },
      });

      return customer;
    }),

  deleteById: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.customer.delete({
        where: { id: input.customerId },
      });
    }),
});
