import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError: ({ path, error }) => {
    console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
  },
  middleware(req, res, next) {
    console.log(
      JSON.stringify({
        method: req.method,
        url: req.url,
        body: req.body,
        userAgent: req.headers["user-agent"],
        responseCode: res.statusCode,
      })
    );
    next();
  },
});
