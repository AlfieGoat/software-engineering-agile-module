/* eslint-disable @typescript-eslint/unbound-method */
import "./__mocks__/env";

import { createTestContext, trpcRequest, type MockContext } from "./utils";

let mockCtx: MockContext;

beforeEach(() => {
  mockCtx = createTestContext();
});

describe("Product Router", () => {
  describe("create", () => {
    it("should throw an error when the name is too short", async () => {
      const input = {
        name: "abc",
        description: "Test product",
        graphQLSubsets: [{ id: "123" }],
      };
      await expect(
        trpcRequest(mockCtx).product.create(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.create).not.toHaveBeenCalled();
    });

    it("should throw an error when the name is too long", async () => {
      const input = {
        name: "a".repeat(81),
        description: "Test product",
        graphQLSubsets: [{ id: "123" }],
      };
      await expect(
        trpcRequest(mockCtx).product.create(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.create).not.toHaveBeenCalled();
    });

    it("should throw an error when the description is too long", async () => {
      const input = {
        name: "Test product",
        description: "a".repeat(1001),
        graphQLSubsets: [{ id: "123" }],
      };
      await expect(
        trpcRequest(mockCtx).product.create(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.create).not.toHaveBeenCalled();
    });

    it("should throw an error when graphQLSubsets are not provided", async () => {
      const input = {
        name: "Test product",
        description: "Test description",
      };
      await expect(
        //@ts-expect-error - Unit test
        trpcRequest(mockCtx).product.create(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.create).not.toHaveBeenCalled();
    });

    it("should throw an error when an invalid graphQLSubsets id is provided", async () => {
      const input = {
        name: "Test product",
        description: "Test description",
        graphQLSubsets: [{ id: "invalid-id" }],
      };
      mockCtx.prisma.graphQLSubset.findMany.mockResolvedValue([]);
      await expect(
        trpcRequest(mockCtx).product.create(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.create).not.toHaveBeenCalled();
    });

    it("should create a new product when input is valid", async () => {
      const input = {
        name: "Test product",
        description: "Test description",
        graphQLSubsets: [{ id: "valid-id" }],
      };
      const product = {
        id: "1234567890",
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        subsets: [{ id: "valid-id" }],
        graphQLSchema: `type Query {
            hello(id: ID!): String
          }`,
      };
      mockCtx.prisma.product.create.mockResolvedValue(product);
      mockCtx.prisma.graphQLSubset.findMany.mockResolvedValue([
        {
          id: "valid-id",
          createdAt: new Date(),
          description: "",
          graphQLSchema: `type Query {
            hello(id: ID!): String
          }`,
          name: "",
          query: `query MyQuery {
            __typename ## Placeholder value
          }
          `,
        },
      ]);

      const result = await trpcRequest(mockCtx).product.create(input);

      expect(result).toEqual(product);
      expect(mockCtx.prisma.product.create).toMatchInlineSnapshot(`
        [MockFunction] {
          "calls": [
            [
              {
                "data": {
                  "description": "Test description",
                  "graphQLSchema": "type Query {
          hello(id: ID!): String
        }

        schema {
          query: Query
        }",
                  "name": "Test product",
                  "subsets": {
                    "connect": [
                      {
                        "id": "valid-id",
                      },
                    ],
                  },
                },
              },
            ],
          ],
          "results": [
            {
              "type": "return",
              "value": Promise {},
            },
          ],
        }
      `);
    });
  });

  describe("getById", () => {
    it("should return the product with the given ID", async () => {
      const productId = "1234567890";
      const product = {
        id: productId,
        name: "Test product",
        description: "Test description",
        createdAt: new Date(),
        updatedAt: new Date(),
        subsets: [{ id: "valid-id" }],
        customers: [],
        graphQLSchema: `type Query {
          hello(id: ID!): String
        }`,
      };
      mockCtx.prisma.product.findUnique.mockResolvedValue(product);

      const result = await trpcRequest(mockCtx).product.getById({
        productId,
      });

      expect(result).toEqual(product);
      expect(mockCtx.prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: { subsets: true, customers: true },
      });
    });
  });

  describe("getAll", () => {
    it("should return the correct number of items when limit is specified", async () => {
      const products = [
        {
          id: "1",
          name: "Product 1",
          description: "Test product",
          createdAt: new Date(),
          updatedAt: new Date(),
          subsets: [{ id: "1" }],
          customers: [],
          graphQLSchema: `type Query {
            hello(id: ID!): String
          }`,
        },
        {
          id: "2",
          name: "Product 2",
          description: "Another test product",
          createdAt: new Date(),
          updatedAt: new Date(),
          subsets: [{ id: "2" }],
          customers: [],
          graphQLSchema: `type Query {
            hello(id: ID!): String
          }`,
        },
      ];
      mockCtx.prisma.product.findMany.mockResolvedValue(products);

      const result = await trpcRequest(mockCtx).product.getAll({
        limit: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeDefined();
      expect(mockCtx.prisma.product.findMany).toHaveBeenCalledWith({
        take: 2,
        cursor: undefined,
        orderBy: {
          createdAt: "asc",
        },
        include: { subsets: true, customers: true },
      });
    });
    it("should return the correct number of items when cursor is not specified", async () => {
      const input = {
        filterText: "Test",
        limit: 2,
      };
      const products = [
        {
          id: "1",
          name: "Test product 1",
          description: "Test description",
          subsets: [],
          customers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          graphQLSchema: `type Query {
                hello(id: ID!): String
              }`,
        },
        {
          id: "2",
          name: "Test product 2",
          description: "Test description",
          subsets: [],
          customers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          graphQLSchema: `type Query {
                hello(id: ID!): String
              }`,
        },
      ];
      mockCtx.prisma.product.findMany.mockResolvedValue(products);

      const result = await trpcRequest(mockCtx).product.getAll(input);

      expect(result).toEqual({
        items: products,
        nextCursor: undefined,
      });
      expect(mockCtx.prisma.product.findMany).toHaveBeenCalledWith({
        take: input.limit + 1,
        orderBy: {
          createdAt: "asc",
        },
        include: { subsets: true, customers: true },
        where: {
          OR: [
            { name: { contains: input.filterText } },
            {
              description: { contains: input.filterText },
            },
          ],
        },
      });
    });

    it("should return the correct number of items when cursor is specified", async () => {
      const input = {
        filterText: "Test",
        limit: 2,
        cursor: "1",
      };
      const products = [
        {
          id: "2",
          name: "Test product 2",
          description: "Test description",
          subsets: [],
          customers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          graphQLSchema: `type Query {
                hello(id: ID!): String
              }`,
        },
        {
          id: "3",
          name: "Test product 3",
          description: "Test description",
          subsets: [],
          customers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          graphQLSchema: `type Query {
                hello(id: ID!): String
              }`,
        },
      ];
      mockCtx.prisma.product.findMany.mockResolvedValue(products);

      const result = await trpcRequest(mockCtx).product.getAll(input);

      expect(result).toEqual({
        items: products,
        nextCursor: undefined,
      });
      expect(mockCtx.prisma.product.findMany).toHaveBeenCalledWith({
        take: input.limit + 1,
        cursor: { id: input.cursor },
        orderBy: {
          createdAt: "asc",
        },
        include: { subsets: true, customers: true },
        where: {
          OR: [
            { name: { contains: input.filterText } },
            {
              description: { contains: input.filterText },
            },
          ],
        },
      });
    });
  });

  describe("updateById", () => {
    it("should throw an error when productId is invalid", async () => {
      const input = {
        productId: "invalid-id",
        editedProduct: {
          name: "Test product",
          description: "Test description",
          graphQLSubsets: [{ id: "valid-id" }],
        },
      };
      mockCtx.prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        trpcRequest(mockCtx).product.updateById(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.update).not.toHaveBeenCalled();
    });

    it("should throw an error when an invalid graphQLSubsets id is provided", async () => {
      const input = {
        productId: "valid-id",
        editedProduct: {
          name: "Test product",
          description: "Test description",
          graphQLSubsets: [{ id: "invalid-id" }],
        },
      };
      //@ts-expect-error -  Unit test
      mockCtx.prisma.product.findUnique.mockResolvedValue({
        id: input.productId,
        name: "Old product name",
        description: "Old product description",
        subsets: [],
        customers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        graphQLSchema: `type Query {
          hello(id: ID!): String
        }`,
      });
      mockCtx.prisma.graphQLSubset.findMany.mockResolvedValue([]);

      await expect(
        trpcRequest(mockCtx).product.updateById(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.update).not.toHaveBeenCalled();
    });
    it("should throw an error when an invalid graphQLSubsets id is provided", async () => {
      const input = {
        productId: "valid-id",
        editedProduct: {
          name: "Test product",
          description: "Test description",
          graphQLSubsets: [{ id: "invalid-id" }],
        },
      };
      mockCtx.prisma.graphQLSubset.findMany.mockResolvedValue([]);
      await expect(
        trpcRequest(mockCtx).product.updateById(input)
      ).rejects.toThrow();

      expect(mockCtx.prisma.product.update).not.toHaveBeenCalled();
    });

    it("should update the product when input is valid", async () => {
      const input = {
        productId: "valid-id",
        editedProduct: {
          name: "Test product",
          description: "Test description",
          graphQLSubsets: [{ id: "valid-id" }],
        },
      };
      const graphQLSubsets = [
        {
          id: "valid-id",
          createdAt: new Date(),
          description: "",
          graphQLSchema: `type Query {
              hello(id: ID!): String
            }`,
          name: "",
          query: `query MyQuery {
        __typename ## Placeholder value
      }
      `,
        },
      ];
      const product = {
        id: "valid-id",
        name: "Old name",
        description: "Old description",
        createdAt: new Date(),
        updatedAt: new Date(),
        subsets: [{ id: "old-subset-id" }],
        graphQLSchema: `type Query {
              hello(id: ID!): String
            }`,
      };
      mockCtx.prisma.graphQLSubset.findMany.mockResolvedValue(graphQLSubsets);
      mockCtx.prisma.product.update.mockResolvedValue(product);

      const result = await trpcRequest(mockCtx).product.updateById(input);

      expect(result).toEqual(product);
      expect(mockCtx.prisma.product.update).toHaveBeenCalledWith({
        where: { id: input.productId },
        data: {
          description: input.editedProduct.description,
          graphQLSchema: `type Query {
  hello(id: ID!): String
}

schema {
  query: Query
}`,
          name: input.editedProduct.name,
          subsets: { set: input.editedProduct.graphQLSubsets },
        },
      });
    });
  });

  describe("deleteById", () => {
    it("should throw an error when trying to delete a product associated with customers", async () => {
      const productId = "1234567890";
      const product = {
        id: productId,
        name: "Test product",
        description: "Test description",
        createdAt: new Date(),
        updatedAt: new Date(),
        subsets: [{ id: "valid-id" }],
        customers: [{ id: "1" }],
        graphQLSchema: `type Query {
          hello(id: ID!): String
        }`,
      };
      mockCtx.prisma.product.findUniqueOrThrow.mockResolvedValue(product);

      await expect(
        trpcRequest(mockCtx).product.deleteById({
          productId,
        })
      ).rejects.toThrow();
      expect(mockCtx.prisma.product.delete).not.toHaveBeenCalled();
    });

    it("should delete the product when there are no customers associated with it", async () => {
      const productId = "1234567890";
      const product = {
        id: productId,
        name: "Test product",
        description: "Test description",
        createdAt: new Date(),
        updatedAt: new Date(),
        subsets: [{ id: "valid-id" }],
        customers: [],
        graphQLSchema: `type Query {
          hello(id: ID!): String
        }`,
      };
      mockCtx.prisma.product.findUniqueOrThrow.mockResolvedValue(product);

      await trpcRequest(mockCtx).product.deleteById({
        productId,
      });

      expect(mockCtx.prisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });
  });
});
