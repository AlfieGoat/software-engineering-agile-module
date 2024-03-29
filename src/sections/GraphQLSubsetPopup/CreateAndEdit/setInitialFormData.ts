import produce from "immer";
import { type FormData } from "./atoms";
import {
  type CreateNewGraphQLSubsetsProps,
  type EditGraphQLSubsetPopupProps,
} from "./index";

export function setInitialFormData(
  props: CreateNewGraphQLSubsetsProps | EditGraphQLSubsetPopupProps,
  setFormData: (args_0: FormData | ((prev: FormData) => FormData)) => void,
  formData: FormData
) {
  if (props.type === "Edit") {
    setFormData(
      produce((draft) => {
        draft.graphQLSchema = props.graphQLSubsetToEdit.graphQLSchema;
        draft.description = props.graphQLSubsetToEdit.description;
        draft.name = props.graphQLSubsetToEdit.name;
        draft.query = props.graphQLSubsetToEdit.query ?? "";
      }, formData)
    );
  } else if (props.type === "Create") {
    setFormData({ description: "", name: "", graphQLSchema: "", query: "" });
  }
}
