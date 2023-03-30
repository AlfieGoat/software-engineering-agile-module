import { type api } from "~/utils/api";
import { type FormData } from "./atoms";
import { type CreateNewProductsProps, type EditProductsProps } from "./index";

export const onSubmit = async (
  formData: FormData,
  props: CreateNewProductsProps | EditProductsProps,
  productCreateMutation: ReturnType<typeof api.product.create.useMutation>,
  productUpdateMutation: ReturnType<typeof api.product.updateById.useMutation>
) => {
  try {
    if (props.type === "Create") {
      await productCreateMutation.mutateAsync({
        description: formData.description,
        name: formData.name,
        graphQLSubsets: formData.graphQLSubsetIds.map((graphQLSubsetId) => ({
          id: graphQLSubsetId,
        })),
      });
    } else {
      await productUpdateMutation.mutateAsync({
        productId: props.productToEdit.id,
        editedProduct: {
          description: formData.description,
          name: formData.name,
          graphQLSubsets: formData.graphQLSubsetIds.map((graphQLSubsetId) => ({
            id: graphQLSubsetId,
          })),
        },
      });
    }
    await props.refetchProductsData();
    props.closePopup();
    props.removeSelected();
  } catch {}
};
