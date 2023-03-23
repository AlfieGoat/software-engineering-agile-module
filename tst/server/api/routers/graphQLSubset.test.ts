/* eslint-disable @typescript-eslint/unbound-method */
import "./__mocks__/env";

import { type GraphQLSubset, type Product } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import updateProduct from "~/server/api/routers/product/updateProduct";
import { createTestContext, trpcRequest, type MockContext } from "./utils";

let mockCtx: MockContext;

beforeEach(() => {
  mockCtx = createTestContext();
});

describe("GraphQL Subset Router", () => {
  describe("Create", () => {
    test("should create a new GraphQL subset", async () => {
      const input = {
        graphQLSchema: `
          type Query {
            hello: String!
          }
        `,
        name: "Test Subset",
        description: "A GraphQL subset for testing purposes",
      };

      const newGraphQLSubset = {
        id: "1234567890",
        graphQLSchema: input.graphQLSchema,
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.graphQLSubset.create.mockResolvedValue(newGraphQLSubset);

      const result = await trpcRequest(mockCtx).graphQLSubset.create(input);

      expect(result).toEqual(newGraphQLSubset);
      expect(mockCtx.prisma.graphQLSubset.create).toHaveBeenCalledWith({
        data: {
          graphQLSchema: input.graphQLSchema,
          name: input.name,
          description: input.description,
        },
      });
    });
  });

  describe("getById", () => {
    test("should get a GraphQL subset by id", async () => {
      const graphQLSubsetId = "1234567890";

      const graphQLSubset = {
        id: graphQLSubsetId,
        graphQLSchema: `
          type Query {
            hello: String!
          }
        `,
        name: "Test Subset",
        description: "A GraphQL subset for testing purposes",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.graphQLSubset.findUnique.mockResolvedValue(graphQLSubset);

      const result = await trpcRequest(mockCtx).graphQLSubset.getById({
        graphQLSubsetId,
      });

      expect(result).toEqual(graphQLSubset);
      expect(mockCtx.prisma.graphQLSubset.findUnique).toHaveBeenCalledWith({
        where: { id: graphQLSubsetId },
      });
    });
  });

  describe("getAll", () => {
    test("should get a list of GraphQL subsets", async () => {
      const limit = 10;
      const cursor = "abc";
      const filterText = "test";

      const graphQLSubsets = [
        {
          id: "1",
          graphQLSchema: `
            type Query {
              hello: String!
            }
          `,
          name: "Test Subset 1",
          description: "A GraphQL subset for testing purposes",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          graphQLSchema: `
            type Query {
              world: String!
            }
          `,
          name: "Test Subset 2",
          description: "Another GraphQL subset for testing purposes",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCtx.prisma.graphQLSubset.findMany.mockResolvedValue(graphQLSubsets);

      const result = await trpcRequest(mockCtx).graphQLSubset.getAll({
        limit,
        cursor,
        filterText,
      });

      expect(result).toEqual({ items: graphQLSubsets, nextCursor: undefined });
      expect(mockCtx.prisma.graphQLSubset.findMany).toHaveBeenCalledWith({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "asc" },
        include: { products: true },
        ...(filterText
          ? {
              where: {
                OR: [
                  { name: { contains: filterText } },
                  {
                    description: { contains: filterText },
                  },
                ],
              },
            }
          : {}),
      });
    });
  });

  describe("Update By Id", () => {
    test("should update a GraphQL subset by id", async () => {
      const graphQLSubsetId = "1234567890";
      const editedGraphQLSubset = {
        graphQLSchema: `type Query {
          hello(id: ID!): String
        }`,
        name: "Edited Test Subset",
        description: "An edited GraphQL subset for testing purposes",
      };

      const oldGraphQLSubset: GraphQLSubset & {
        products: (Product & {
          subsets: GraphQLSubset[];
        })[];
      } = {
        id: graphQLSubsetId,
        graphQLSchema: `type Query {
          hello: String
        }`,
        name: "Test Subset",
        description: "A GraphQL subset for testing purposes",
        createdAt: new Date(),
        products: [
          {
            createdAt: new Date(),
            description: "",
            graphQLSchema: `type Query {
          hello: String
        }`,
            id: "123",
            name: "123",
            subsets: [
              {
                createdAt: new Date(),
                id: graphQLSubsetId,
                graphQLSchema: `type Query {
              hello: String
            }`,
                description: "",
                name: "",
              },
            ],
          },
        ],
      };

      const updatedGraphQLSubset = {
        id: graphQLSubsetId,
        graphQLSchema: editedGraphQLSubset.graphQLSchema,
        name: editedGraphQLSubset.name,
        description: editedGraphQLSubset.description,
        createdAt: oldGraphQLSubset.createdAt,
        updatedAt: new Date(),
      };

      const updateProductSpy = jest.spyOn(updateProduct, "updateProduct");
      updateProductSpy.mockResolvedValue({
        createdAt: new Date(),
        description: "",
        graphQLSchema: `type Query {
        hello(id: ID!): String
      }`,
        id: "",
        name: "",
      });

      mockCtx.prisma.$transaction.mockImplementation((callback) =>
        callback(mockCtx.prisma)
      );
      mockCtx.prisma.graphQLSubset.findUniqueOrThrow.mockResolvedValue(
        oldGraphQLSubset
      );
      mockCtx.prisma.graphQLSubset.update.mockResolvedValue(
        updatedGraphQLSubset
      );

      const result = await trpcRequest(mockCtx).graphQLSubset.updateById({
        graphQLSubsetId,
        editedGraphQLSubset,
      });

      expect(result).toEqual(updatedGraphQLSubset);
      expect(
        mockCtx.prisma.graphQLSubset.findUniqueOrThrow
      ).toHaveBeenCalledWith({
        where: { id: graphQLSubsetId },
        include: { products: { include: { subsets: true } } },
      });
      expect(mockCtx.prisma.graphQLSubset.update).toHaveBeenCalledWith({
        where: { id: graphQLSubsetId },
        data: {
          graphQLSchema: editedGraphQLSubset.graphQLSchema,
          name: editedGraphQLSubset.name,
          description: editedGraphQLSubset.description,
        },
      });
      expect(mockCtx.prisma.$transaction).toHaveBeenCalled();
      expect(updateProductSpy).toHaveBeenCalledTimes(
        oldGraphQLSubset.products.length
      );
      expect(updateProductSpy).toBeCalledWith(
        {
          editedProduct: {
            description: "",
            graphQLSubsets: [{ id: graphQLSubsetId }],
            name: "123",
          },
          productId: "123",
        },
        mockCtx.prisma
      );
    });

    test("should throw TRPCError when invalid new schema provided", async () => {
      const subsetId = "1234567890";
      const editedGraphQLSubset = {
        graphQLSchema: "brokenSchema",
        name: "Test Subset",
        description: "A GraphQL subset for testing purposes",
      };

      const graphQLSubset: GraphQLSubset & {
        products: (Product & {
          subsets: GraphQLSubset[];
        })[];
      } = {
        createdAt: new Date(),
        description: "",
        graphQLSchema: "",
        id: "",
        name: "",
        products: [
          {
            createdAt: new Date(),
            description: "",
            graphQLSchema: "",
            id: "",
            name: "",
            subsets: [
              {
                createdAt: new Date(),
                description: "",
                graphQLSchema: "",
                id: "",
                name: "",
              },
            ],
          },
        ],
      };

      mockCtx.prisma.$transaction.mockImplementation((callback) =>
        callback(mockCtx.prisma)
      );
      mockCtx.prisma.graphQLSubset.findUniqueOrThrow.mockResolvedValue(
        graphQLSubset
      );

      await expect(
        trpcRequest(mockCtx).graphQLSubset.updateById({
          graphQLSubsetId: subsetId,
          editedGraphQLSubset,
        })
      ).rejects.toThrow();

      expect(
        mockCtx.prisma.graphQLSubset.findUniqueOrThrow
      ).toHaveBeenCalledWith({
        where: { id: subsetId },
        include: { products: { include: { subsets: true } } },
      });
    });

    test("should throw TRPCError when updateProduct throws", async () => {
      const subsetId = "1234567890";
      const editedGraphQLSubset = {
        graphQLSchema: `
        type Query {
          hello: String!
        }
      `,
        name: "Test Subset",
        description: "A GraphQL subset for testing purposes",
      };

      const mockError = new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });

      mockCtx.prisma.$transaction.mockImplementation((callback) =>
        callback(mockCtx.prisma)
      );

      const updateProductSpy = jest.spyOn(updateProduct, "updateProduct");
      updateProductSpy.mockRejectedValue(mockError);

      const graphQLSubset: GraphQLSubset & {
        products: (Product & {
          subsets: GraphQLSubset[];
        })[];
      } = {
        createdAt: new Date(),
        description: "",
        graphQLSchema: "",
        id: "",
        name: "",
        products: [
          {
            createdAt: new Date(),
            description: "",
            graphQLSchema: "",
            id: "",
            name: "",
            subsets: [
              {
                createdAt: new Date(),
                description: "",
                graphQLSchema: "",
                id: "",
                name: "",
              },
            ],
          },
        ],
      };
      mockCtx.prisma.graphQLSubset.findUniqueOrThrow.mockResolvedValue(
        graphQLSubset
      );

      await expect(
        trpcRequest(mockCtx).graphQLSubset.updateById({
          graphQLSubsetId: subsetId,
          editedGraphQLSubset,
        })
      ).rejects.toThrow();

      expect(
        mockCtx.prisma.graphQLSubset.findUniqueOrThrow
      ).toHaveBeenCalledWith({
        where: { id: subsetId },
        include: { products: { include: { subsets: true } } },
      });
    });
  });
  describe("deleteById", () => {
    test("should delete a GraphQL subset if not associated with any products", async () => {
      const subsetId = "1234567890";
      const subset = {
        id: subsetId,
        graphQLSchema: `
          type Query {
            hello: String!
          }
        `,
        name: "Test Subset",
        description: "A GraphQL subset for testing purposes",
        createdAt: new Date(),
        updatedAt: new Date(),
        products: [],
      };
      mockCtx.prisma.graphQLSubset.findUniqueOrThrow.mockResolvedValue(subset);
      mockCtx.prisma.graphQLSubset.delete.mockResolvedValue(subset);

      await trpcRequest(mockCtx).graphQLSubset.deleteById({
        graphQLSubsetId: subsetId,
      });

      expect(mockCtx.prisma.graphQLSubset.delete).toHaveBeenCalledWith({
        where: { id: subsetId },
      });
    });

    test("should not delete a GraphQL subset if associated with products", async () => {
      const subsetId = "1234567890";
      const subset = {
        id: subsetId,
        graphQLSchema: `
          type Query {
            hello: String!
          }
        `,
        name: "Test Subset",
        description: "A GraphQL subset for testing purposes",
        createdAt: new Date(),
        updatedAt: new Date(),
        products: [{ id: "1" }],
      };
      mockCtx.prisma.graphQLSubset.findUniqueOrThrow.mockResolvedValue(subset);

      await expect(
        trpcRequest(mockCtx).graphQLSubset.deleteById({
          graphQLSubsetId: subsetId,
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You cannot delete a GraphQLSubset that is still associated with products.",
        })
      );

      expect(mockCtx.prisma.graphQLSubset.delete).not.toHaveBeenCalled();
    });
  });

  describe("extractMinimumGraphQLSchemaFromQuery", () => {
    const sourceGraphQLSchema = {
      id: "1",
      graphQLSchema: `
      scalar DateTime

      interface Event {
        id: ID!
        name: String!
        description: String!
        date: DateTime!
        location: String!
        organizer: Organizer!
      }
      
      type ClubNight implements Event {
        id: ID!
        name: String!
        description: String!
        date: DateTime!
        location: String!
        organizer: Organizer!
        musicGenre: String!
        ageRestriction: Int!
      }
      
      type Concert implements Event {
        id: ID!
        name: String!
        description: String!
        date: DateTime!
        location: String!
        organizer: Organizer!
        performer: String!
        ticketPrice: Float!
        venue: String
      }
      
      type Organizer {
        id: ID!
        name: String!
        email: String!
        events: [Event!]!
      }
      
      enum EventCategory {
        MUSIC
        SPORTS
        ARTS
        EDUCATION
      }
      
      input EventInput {
        name: String!
        description: String!
        date: DateTime!
        location: String!
        category: EventCategory!
      }
      
      input OrganizerInput {
        name: String!
        email: String!
      }
      
      union SearchResult = Event | Organizer
      
      type Query {
        event(id: ID!): Event
        organizer(id: ID!): Organizer
        search(query: String!, filters: EventInput): [SearchResult!]!
      }
      
      type Mutation {
        createEvent(input: EventInput!): Event
        updateEvent(id: ID!, input: EventInput!): Event
        deleteEvent(id: ID!): Boolean
        createOrganizer(input: OrganizerInput!): Organizer
        updateOrganizer(id: ID!, input: OrganizerInput!): Organizer
        deleteOrganizer(id: ID!): Boolean
      }
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockCtx.prisma.sourceGraphQLSchema.findFirst.mockResolvedValue(
        sourceGraphQLSchema
      );
    });

    test("selects field on Query type and subfield of string type", async () => {
      const query = `query MyQuery {
        event {
          description
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "interface Event {
          description: String!
        }

        type Query {
          event: Event
        }
        "
      `);
    });

    test("selects field on Query type and subfield with custom scalar type", async () => {
      const query = `query MyQuery {
        event {
          date
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "scalar DateTime

        interface Event {
          date: DateTime!
        }

        type Query {
          event: Event
        }
        "
      `);
    });

    test("selects field on Query type and multiple subfields", async () => {
      const query = `query MyQuery {
        event {
          description
          id
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "interface Event {
          id: ID!
          description: String!
        }

        type Query {
          event: Event
        }
        "
      `);
    });

    test("selects field on Query type and subfield and inline spread with subfields", async () => {
      const query = `query MyQuery {
        event {
          description
          id
          ... on ClubNight {
            id
            name
          }
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "interface Event {
          id: ID!
          description: String!
        }

        type ClubNight implements Event {
          id: ID!
          name: String!
        }

        type Query {
          event: Event
        }
        "
      `);
    });

    test("selects field on Query type with argument and subfields", async () => {
      const query = `query MyQuery {
        event(id: "") {
          description
          id
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "interface Event {
          id: ID!
          description: String!
        }

        type Query {
          event(id: ID!): Event
        }
        "
      `);
    });

    test("only picks a single part of the union when only a single part of the union is specified", async () => {
      const query = `query MyQuery {
        search {
          ... on Event {
            id
            name
          }
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "interface Event {
          id: ID!
          name: String!
        }

        union SearchResult = Event

        type Query {
          search: [SearchResult!]!
        }
        "
      `);
    });

    test("picks all of the union when all of the union is used", async () => {
      const query = `query MyQuery {
        search {
          ... on Event {
            id
            name
          }
          ... on Organizer {
            id
            email
          }
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "interface Event {
          id: ID!
          name: String!
        }

        type Organizer {
          id: ID!
          email: String!
        }

        union SearchResult = Event | Organizer

        type Query {
          search: [SearchResult!]!
        }
        "
      `);
    });

    test("selects nested argument objects", async () => {
      const query = `query MyQuery {
        search(filters: {date: "", category: MUSIC}) {
          ... on Event {
            id
            name
          }
          ... on Organizer {
            id
            email
          }
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "scalar DateTime

        interface Event {
          id: ID!
          name: String!
        }

        type Organizer {
          id: ID!
          email: String!
        }

        enum EventCategory {
          MUSIC
          SPORTS
          ARTS
          EDUCATION
        }

        input EventInput {
          date: DateTime!
          category: EventCategory!
        }

        union SearchResult = Event | Organizer

        type Query {
          search(filters: EventInput): [SearchResult!]!
        }
        "
      `);
    });

    test("selects correctly with deeply nested field where types are specified multiple times", async () => {
      const query = `query MyQuery {
        search(filters: {date: "", category: MUSIC}) {
          ... on Event {
            id
            name
            organizer {
              email
              events {
                date
                description
                location
                id
              }
            }
          }
          ... on Organizer {
            id
            email
          }
        }
      }`;

      const result = await trpcRequest(
        mockCtx
      ).graphQLSubset.extractMinimumGraphQLSchemaFromQuery({
        query,
      });

      expect(result).toMatchInlineSnapshot(`
        "scalar DateTime

        interface Event {
          id: ID!
          name: String!
          description: String!
          date: DateTime!
          location: String!
          organizer: Organizer!
        }

        type Organizer {
          id: ID!
          email: String!
          events: [Event!]!
        }

        enum EventCategory {
          MUSIC
          SPORTS
          ARTS
          EDUCATION
        }

        input EventInput {
          date: DateTime!
          category: EventCategory!
        }

        union SearchResult = Event | Organizer

        type Query {
          search(filters: EventInput): [SearchResult!]!
        }
        "
      `);
    });

    test("throws when malformed query passed in", async () => {
      const query = `qwertyuio`;

      await expect(
        trpcRequest(mockCtx).graphQLSubset.extractMinimumGraphQLSchemaFromQuery(
          {
            query,
          }
        )
      ).rejects.toThrowError('Syntax Error: Unexpected Name "qwertyuio".');
    });

    test("throws when query specifies field that doesn't exist", async () => {
      const query = `query MyQuery {
        event {
          description
          nonExistent
        }
      }`;

      await expect(
        trpcRequest(mockCtx).graphQLSubset.extractMinimumGraphQLSchemaFromQuery(
          {
            query,
          }
        )
      ).rejects.toThrowError(
        "Could not find nextPathType for field: nonExistent"
      );
    });

    test("throws when query specifies argument that doesn't exist", async () => {
      const query = `query MyQuery {
        event(nonExistent: "123") {
          description
        }
      }`;

      await expect(
        trpcRequest(mockCtx).graphQLSubset.extractMinimumGraphQLSchemaFromQuery(
          {
            query,
          }
        )
      ).rejects.toThrowError("Couldn't find argument");
    });
  });
});
