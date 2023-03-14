import produce from "immer";
import { FormData } from "./atoms";
import {
  CreateNewGraphQLSubsetsProps,
  EditGraphQLSubsetPopupProps,
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
      }, formData)
    );
  } else if (props.type === "Create") {
    setFormData({ description: "", name: "", graphQLSchema: "" });
  }
}
