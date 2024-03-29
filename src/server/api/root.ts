import { userRouter } from "~/server/api/routers/user/router";
import { createTRPCRouter } from "~/server/api/trpc";
import { customerRouter } from "./routers/customers/router";
import { graphQLSubsetRouter } from "./routers/graphQLSubset/router";
import { productRouter } from "./routers/product/router";
import { sourceGraphQLSchemaRouter } from "./routers/sourceGraphQLSchema/router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  customer: customerRouter,
  user: userRouter,
  product: productRouter,
  graphQLSubset: graphQLSubsetRouter,
  sourceGraphQLSchema: sourceGraphQLSchemaRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
