/* eslint-disable @typescript-eslint/unbound-method */
import "./__mocks__/env";

import { type Customer } from "@prisma/client";
import { createTestContext, trpcRequest, type MockContext } from "./utils";

let mockCtx: MockContext;

beforeEach(() => {
  mockCtx = createTestContext();
});

describe("Customer Router", () => {
  describe("Create", () => {
    test("should create a new customer", async () => {
      const input = {
        name: "Test Customer",
        description: "A customer for testing purposes",
        productId: "1",
      };

      const newCustomer: Customer = {
        id: "1234567890",
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        productId: input.productId,
        updatedAt: new Date(),
      };

      mockCtx.prisma.customer.create.mockResolvedValue(newCustomer);

      const result = await trpcRequest(mockCtx).customer.create(input);

      expect(result).toEqual(newCustomer);
      expect(mockCtx.prisma.customer.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          description: input.description,
          product: { connect: { id: input.productId } },
        },
      });
    });

    test("should throw an error when input is invalid", async () => {
        const input = {
          name: "Bad",
          description: "",
          productId: "1",
        };
      
        await expect(trpcRequest(mockCtx).customer.create(input)).rejects.toThrow();
      
        expect(mockCtx.prisma.customer.create).not.toHaveBeenCalled();
      });
  });

  describe("getById", () => {
    test("should get a customer by id", async () => {
      const customerId = "1234567890";

      const customer: Customer = {
        id: customerId,
        name: "Test Customer",
        description: "A customer for testing purposes",
        createdAt: new Date(),
        productId: "1",
        updatedAt: new Date(),
      };

      mockCtx.prisma.customer.findUnique.mockResolvedValue(customer);

      const result = await trpcRequest(mockCtx).customer.getById({ customerId });

      expect(result).toEqual(customer);
      expect(mockCtx.prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: customerId },
      });
    });

    test("should return null if customer not found", async () => {
      const customerId = "1234567890";

      mockCtx.prisma.customer.findUnique.mockResolvedValue(null);

      const result = await trpcRequest(mockCtx).customer.getById({ customerId });

      expect(result).toBeNull();
      expect(mockCtx.prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: customerId },
      });
    });
  });

  describe("getAll", () => {
    test("should return a list of customers", async () => {
      const limit = 5;
      const cursor = "1234567890";
      const filterText = "test";

      const customers: Customer[] = [
        {
          id: "1",
          name: "Test Customer 1",
          description: "A customer for testing purposes 1",
          createdAt: new Date(),
          productId: "1",
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Test Customer 2",
          description: "A customer for testing purposes 2",
          createdAt: new Date(),
          productId: "2",
          updatedAt: new Date(),
        },
      ];

      mockCtx.prisma.customer.findMany.mockResolvedValue(customers);

      const result = await trpcRequest(mockCtx).customer.getAll({
        limit,
        cursor,
        filterText,
      });

      expect(result.items).toEqual(customers);
      expect(mockCtx.prisma.customer.findMany).toHaveBeenCalledWith({
        take: limit + 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "asc",
        },
        include: { product: true },
        where: {
          OR: [
            { name: { contains: filterText, mode: "insensitive" } },
            { description: { contains: filterText, mode: "insensitive" } },
          ],
        },
      });
    });

    test("should return an empty list if no customers found", async () => {
      const limit = 5;
      const cursor = "1234567890";
      const filterText = "test";

      mockCtx.prisma.customer.findMany.mockResolvedValue([]);

      const result = await trpcRequest(mockCtx).customer.getAll({
        limit,
        cursor,
        filterText,
      });

      expect(result.items).toEqual([]);
      expect(mockCtx.prisma.customer.findMany).toHaveBeenCalledWith({
        take: limit + 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "asc",
        },
        include: { product: true },
        where: {
          OR: [
            { name: { contains: filterText, mode: "insensitive" } },
            { description: { contains: filterText, mode: "insensitive" } },
          ],
        },
      });
    });
  });

  describe("updateById", () => {
    test("should update a customer by id", async () => {
      const customerId = "1234567890";

      const input = {
        name: "Updated Test Customer",
        description: "An updated customer for testing purposes",
        productId: "2",
      };

      const updatedCustomer: Customer = {
        id: customerId,
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        productId: input.productId,
        updatedAt: new Date(),
      };

      mockCtx.prisma.customer.update.mockResolvedValue(updatedCustomer);

      const result = await trpcRequest(mockCtx).customer.updateById({
        customerId,
        editedCustomer: input,
      });

      expect(result).toEqual(updatedCustomer);
      expect(mockCtx.prisma.customer.update).toHaveBeenCalledWith({
        data: {
          name: input.name,
          description: input.description,
          product: { connect: { id: input.productId } },
        },
        where: { id: customerId },
      });
    });

    test("should throw an error when input is invalid", async () => {
      const customerId = "1234567890";

      const input = {
        name: "Bad",
        description: "",
        productId: "1",
      };

      await expect(
        trpcRequest(mockCtx).customer.updateById({
          customerId,
          editedCustomer: input,
        })
      ).rejects.toThrow();

      expect(mockCtx.prisma.customer.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    test("should delete a customer by id", async () => {
      const customerId = "1234567890";

      await trpcRequest(mockCtx).customer.deleteById({ customerId });

      expect(mockCtx.prisma.customer.delete).toHaveBeenCalledWith({
        where: { id: customerId },
      });
    });
  });
});


