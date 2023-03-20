import produce from "immer";
import { type FormData } from "./atoms";
import { type CreateNewProductsProps, type EditProductsProps } from "./index";

export function setInitialFormData(
  props: CreateNewProductsProps | EditProductsProps,
  setFormData: (args_0: FormData | ((prev: FormData) => FormData)) => void,
  formData: FormData
) {
  if (props.type === "Edit") {
    setFormData(
      produce((draft) => {
        draft.graphQLSubsetIds = props.productToEdit.subsets.map(
          (graphQLSubset) => graphQLSubset.id
        );
        draft.description = props.productToEdit.description;
        draft.name = props.productToEdit.name;
      }, formData)
    );
  } else if (props.type === "Create") {
    setFormData({ description: "", name: "", graphQLSubsetIds: [] });
  }
}
