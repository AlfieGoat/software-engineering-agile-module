import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { UserRole } from "@prisma/client";

export const userRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input, ctx }) => {
      console.log("Hello", ctx.session?.user.role);
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    console.log(ctx.session?.user.role);
    return ctx.prisma.example.findMany();
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  setUserRole: protectedProcedure
    .input(z.object({ newRole: z.nativeEnum(UserRole) }))
    .mutation(({ input, ctx }) => {
      ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { role: input.newRole },
      });
    }),
});
