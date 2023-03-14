import { api } from "~/utils/api";
import { FormData } from "./atoms";
import { CreateNewGraphQLSubsetsProps, EditGraphQLSubsetPopupProps } from "./index";

export const onSubmit = async (
  formData: FormData,
  props: CreateNewGraphQLSubsetsProps | EditGraphQLSubsetPopupProps,
  productCreateMutation: ReturnType<typeof api.graphQLSubset.create.useMutation>,
  productUpdateMutation: ReturnType<typeof api.graphQLSubset.updateById.useMutation>
) => {
  if (props.type === "Create") {
    await productCreateMutation.mutateAsync({
      description: formData.description,
      name: formData.name,
      graphQLSchema: formData.graphQLSchema,
    });
  } else {
    await productUpdateMutation.mutateAsync({
      graphQLSubsetId: props.graphQLSubsetToEdit.id,
      editedGraphQLSubset: {
        description: formData.description,
        name: formData.name,
        graphQLSchema: formData.graphQLSchema,
      },
    });
  }
  await props.refetchGraphQLSubsetsData();
  props.closePopup();
  props.removeSelected();
};
