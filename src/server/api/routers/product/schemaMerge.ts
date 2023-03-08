import {
  mergeTypeDefs,
  printWithComments,
} from "@graphql-toolkit/schema-merging";
import { GraphQLSubset, Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { DocumentNode } from "graphql";
import { z } from "zod";
import { UpdateProductInputSchema } from "./router";

export const mergeSchemas = (graphQLSubsets: GraphQLSubset[]): DocumentNode => {
  try {
    const mergedSchema = mergeTypeDefs(
      graphQLSubsets.map((graphQLSubset) => graphQLSubset.graphQLSchema)
    );
    return mergedSchema;
  } catch (e) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: e as string,
    });
  }
};

export const updateProduct = async (
  productUpdateData: z.TypeOf<typeof UpdateProductInputSchema>,
  tx: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
  >
) => {
  const graphQLSubsets = await tx.graphQLSubset.findMany({
    where: {
      id: {
        in: productUpdateData.editedProduct.graphQLSubsets.map(
          (graphQLSubset) => graphQLSubset.id
        ),
      },
    },
  });

  const mergedSchemas = mergeSchemas(graphQLSubsets);
  const mergedSchemasSdl = printWithComments(mergedSchemas);

  return tx.product.update({
    where: { id: productUpdateData.productId },
    data: {
      graphQLSchema: mergedSchemasSdl,
      name: productUpdateData.editedProduct.name,
      subsets: { set: productUpdateData.editedProduct.graphQLSubsets },
    },
  });
};
