import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { UserRole } from "@prisma/client";

export const userRouter = createTRPCRouter({
  setUserRole: protectedProcedure
    .input(z.object({ newRole: z.nativeEnum(UserRole) }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { role: input.newRole },
      });

      return input.newRole;
    }),

  getCurrentRole: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user.role;
  }),
});
