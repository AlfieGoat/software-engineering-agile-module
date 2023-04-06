import { type api } from "~/utils/api";
import { type FormData } from "./atoms";
import {
  type CreateNewGraphQLSubsetsProps,
  type EditGraphQLSubsetPopupProps,
} from "./index";

export const onSubmit = async (
  formData: FormData,
  props: CreateNewGraphQLSubsetsProps | EditGraphQLSubsetPopupProps,
  subsetCreateMutation: ReturnType<typeof api.graphQLSubset.create.useMutation>,
  subsetUpdateMutation: ReturnType<
    typeof api.graphQLSubset.updateById.useMutation
  >
) => {
  try {
    if (props.type === "Create") {
      await subsetCreateMutation.mutateAsync({
        description: formData.description,
        name: formData.name,
        graphQLSchema: formData.graphQLSchema,
        query: formData.query,
      });
    } else {
      await subsetUpdateMutation.mutateAsync({
        graphQLSubsetId: props.graphQLSubsetToEdit.id,
        editedGraphQLSubset: {
          description: formData.description,
          name: formData.name,
          graphQLSchema: formData.graphQLSchema,
          query: formData.query,
        },
      });
    }
    await props.refetchGraphQLSubsetsData();
    props.closePopup();
    props.removeSelected();
  } catch {}
};
