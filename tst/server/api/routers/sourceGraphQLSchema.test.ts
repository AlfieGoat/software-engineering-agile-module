/* eslint-disable @typescript-eslint/unbound-method */
import "./__mocks__/env";

import { createTestContext, trpcRequest, type MockContext } from "./utils";

let mockCtx: MockContext;

beforeEach(() => {
  mockCtx = createTestContext();
});

describe("SourceGraphQLSchema Router", () => {
  describe("create", () => {
    test("should create a new source GraphQL schema", async () => {
      const graphQLSchema = "type Query { hello: String }";

      const newSourceGraphQLSchema = {
        id: "1234567890",
        graphQLSchema,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.$transaction.mockResolvedValue(newSourceGraphQLSchema);

      const result = await trpcRequest(mockCtx).sourceGraphQLSchema.create({
        graphQLSchema,
      });

      expect(result).toEqual(newSourceGraphQLSchema);
      expect(mockCtx.prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe("getLatest", () => {
    test("should return the latest source GraphQL schema", async () => {
      const latestSourceGraphQLSchema = {
        id: "1234567890",
        graphQLSchema: "type Query { hello: String }",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.sourceGraphQLSchema.findFirst.mockResolvedValue(
        latestSourceGraphQLSchema
      );

      const result = await trpcRequest(mockCtx).sourceGraphQLSchema.getLatest();

      expect(result).toEqual(latestSourceGraphQLSchema);
      expect(mockCtx.prisma.sourceGraphQLSchema.findFirst).toHaveBeenCalledWith(
        {
          orderBy: { createdAt: "desc" },
        }
      );
    });
  });

  describe("compareLatestSourceGraphQLSchemaWithSubsets", () => {
    test("should compare the latest source GraphQL schema with all subsets", async () => {
      const latestSourceGraphQLSchema = {
        id: "1234567890",
        graphQLSchema: `type Query {
            hello(id: ID!): String
            world(id: ID!): String
          }`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.sourceGraphQLSchema.findFirst.mockResolvedValue(
        latestSourceGraphQLSchema
      );

      mockCtx.prisma.graphQLSubset.findMany.mockResolvedValue([
        {
          createdAt: new Date(),
          description: "DESCRIPTION",
          id: "1234567890",
          name: "NAME",
          graphQLSchema: `type Query {
        hello(id: ID!): String
      }`,
        },
      ]);

      const result = await trpcRequest(
        mockCtx
      ).sourceGraphQLSchema.compareLatestSourceGraphQLSchemaWithSubsets();

      expect(result?.breakingChanges).toEqual([
        { description: "Query.world was removed.", type: "FIELD_REMOVED" },
      ]);

      expect(mockCtx.prisma.sourceGraphQLSchema.findFirst).toHaveBeenCalledWith(
        {
          orderBy: { createdAt: "desc" },
        }
      );
      expect(mockCtx.prisma.graphQLSubset.findMany).toHaveBeenCalledWith({});
    });

    test("should throw an error when no latest source GraphQL schema is found", async () => {
      mockCtx.prisma.sourceGraphQLSchema.findFirst.mockResolvedValue(null);

      await expect(
        trpcRequest(
          mockCtx
        ).sourceGraphQLSchema.compareLatestSourceGraphQLSchemaWithSubsets()
      ).rejects.toThrow();
    });
  });
});
