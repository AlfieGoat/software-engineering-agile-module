import { type PrismaClient, type UserRole } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import { appRouter } from "~/server/api/root";

export type Context = {
  prisma: PrismaClient;
};

export type MockContext = ReturnType<typeof createTestContext>;

export function createTestContext() {
  return {
    prisma: mockDeep<PrismaClient>(),
    session: {
      userId: "1234567890",
      expires: "1234567890",
      id: "1234567890",
      sessionToken: "1234567890",
      user: { id: "1234567890", role: "admin" as UserRole },
    },
  };
}

/** A convenience method to call tRPC queries */
export const trpcRequest = (context: ReturnType<typeof createTestContext>) => {
  return appRouter.createCaller(context);
};
