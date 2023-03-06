import { appRouter } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc";
import { type RouterInputs } from "../../../../src/utils/api";

jest.mock("../../../../src/env", () => ({
  env: {
    NEXTAUTH_SECRET: "SECRET",
    DATABASE_URL: "MOCKED_URL",
    NODE_ENV: "development",
    NEXTAUTH_URL: "MOCKED_URL",
    GITHUB_CLIENT_ID: "MOCKED_CLIENT_ID",
    GITHUB_CLIENT_SECRET: "MOCKED_CLIENT_SECRET",
  },
}));

describe("graphQLSubsetRouter", () => {
  describe("create", () => {

    it("should create a GraphQLSubset when called with valid input", async () => {
      const ctx = await createInnerTRPCContext({
        session: {
          user: { role: "admin", id: "USER_ID" },
          expires: "3451263789",
        },
      });
      const caller = appRouter.createCaller(ctx);

      const input: RouterInputs["graphQLSubset"]["create"] = {
        name: "valid_name",
        graphQLSchema: "valid_schema",
        description: "valid_description",
      };

      const result = await caller.graphQLSubset.create(input);

      expect(result).toMatchObject(input);
    });

    it("should throw an error when called with invalid input", async () => {
      const ctx = await createInnerTRPCContext({
        session: {
          user: { role: "admin", id: "USER_ID" },
          expires: "3451263789",
        },
      });
      const caller = appRouter.createCaller(ctx);

      const input: RouterInputs["graphQLSubset"]["create"] = {
        name: "short",
        graphQLSchema: "",
        description: "too long".repeat(200),
      };

      await expect(caller.graphQLSubset.create(input)).rejects.toThrowError();
    });

    it("should throw an error when called by an unauthenticated user", async () => {
      const ctx = await createInnerTRPCContext({ session: null });
      const caller = appRouter.createCaller(ctx);

      const input: RouterInputs["graphQLSubset"]["create"] = {
        name: "valid_name",
        graphQLSchema: "valid_schema",
        description: "valid_description",
      };

      await expect(caller.graphQLSubset.create(input)).rejects.toThrowError();
    });
  });

  describe("getById", () => {
    it("should return a GraphQLSubset when called with a valid ID", async () => {
      const ctx = await createInnerTRPCContext({
        session: { user: { role: "admin", id: "USER_ID" }, expires: "3451263789" },
      });
      const caller = appRouter.createCaller(ctx);
      const input: RouterInputs["graphQLSubset"]["create"] = {
        name: "valid_name",
        graphQLSchema: "valid_schema",
        description: "valid_description",
      };
      const createdSubset = await caller.graphQLSubset.create(input);
  
      const result = await caller.graphQLSubset.getById({
        graphQLSubsetId: createdSubset.id,
      });
  
      expect(result).toMatchObject(createdSubset);
    });
  
    it("should throw an error when called with an invalid ID", async () => {
      const ctx = await createInnerTRPCContext({
        session: { user: { role: "admin", id: "USER_ID" }, expires: "3451263789" },
      });
      const caller = appRouter.createCaller(ctx);
  
      await expect(
        caller.graphQLSubset.getById({ graphQLSubsetId: "invalid_id" })
      ).resolves.toBeNull();
    });
  
    it("should throw an error when called by an unauthenticated user", async () => {
      const ctx = await createInnerTRPCContext({ session: null });
      const caller = appRouter.createCaller(ctx);
  
      await expect(
        caller.graphQLSubset.getById({ graphQLSubsetId: "valid_id" })
      ).rejects.toThrowError();
    });
  });
  
  describe("getAll", () => {
    it("should return a list of GraphQLSubsets with length no greater than the provided limit", async () => {
      const ctx = await createInnerTRPCContext({
        session: { user: { role: "admin", id: "USER_ID" }, expires: "3451263789" },
      });
      const caller = appRouter.createCaller(ctx);
      const input: RouterInputs["graphQLSubset"]["create"] = {
        name: "valid_name",
        graphQLSchema: "valid_schema",
        description: "valid_description",
      };
      const expectedLength = 2;
      await Promise.all([
        caller.graphQLSubset.create(input),
        caller.graphQLSubset.create(input),
      ]);
  
      const result = await caller.graphQLSubset.getAll({ limit: expectedLength });
  
      expect(result.items.length).toBeLessThanOrEqual(expectedLength);
    });
  
  
    it("should return a list of GraphQLSubsets starting after the specified cursor", async () => {
      const ctx = await createInnerTRPCContext({
        session: { user: { role: "admin", id: "USER_ID" }, expires: "3451263789" },
      });
      const caller = appRouter.createCaller(ctx);
      const input: RouterInputs["graphQLSubset"]["create"] = {
        name: "valid_name",
        graphQLSchema: "valid_schema",
        description: "valid_description",
      };
      const createdSubsets = await Promise.all(
        new Array(3).fill(null).map(() => caller.graphQLSubset.create(input))
      );
      const cursor = createdSubsets[1]!.id;
  
      const result = await caller.graphQLSubset.getAll({ cursor });
  
      expect(result.items.map((item) => item.id)).toEqual(
        createdSubsets.slice(2).map((item) => item.id)
      );
    });
  
    it("should throw an error when called by an unauthenticated user", async () => {
      const ctx = await createInnerTRPCContext({ session: null });
      const caller = appRouter.createCaller(ctx);
  
      await expect(caller.graphQLSubset.getAll({})).rejects.toThrowError();
    });
  });
});

export {};
