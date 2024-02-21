import { printWithComments } from "@graphql-tools/utils";
import { type Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type z } from "zod";
import { mergeSchemas } from "./mergeSchemas";
import { type UpdateProductInputSchema } from "./router";

const updateProduct = async (
  productUpdateData: z.TypeOf<typeof UpdateProductInputSchema>,
  tx: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
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

  if (graphQLSubsets.length === 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Found no graphQLSubsets with the provided ids",
    });

  const mergedSchemas = mergeSchemas(graphQLSubsets);
  const mergedSchemasSdl = printWithComments(mergedSchemas);

  return tx.product.update({
    where: { id: productUpdateData.productId },
    data: {
      description: productUpdateData.editedProduct.description,
      graphQLSchema: mergedSchemasSdl,
      name: productUpdateData.editedProduct.name,
      subsets: { set: productUpdateData.editedProduct.graphQLSubsets },
    },
  });
};

const def = { updateProduct };

export default def;
