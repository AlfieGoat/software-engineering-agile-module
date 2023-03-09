import produce from "immer";
import { FormData } from "./atoms";
import { CreateNewProductsProps, EditProductsProps } from "./index";

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
        draft.name = props.productToEdit.name;
      }, formData)
    );
  } else if (props.type === "Create") {
    setFormData({ name: "", graphQLSubsetIds: [] });
  }
}
