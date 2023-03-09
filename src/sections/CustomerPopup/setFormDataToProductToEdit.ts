import produce from "immer";
import { FormData } from "./atoms";
import { CreateNewCustomerProps, EditCustomerProps } from "./index";

export function setFormDataToProductToEdit(
  props: CreateNewCustomerProps | EditCustomerProps,
  setFormData: (args_0: FormData | ((prev: FormData) => FormData)) => void,
  formData: FormData
) {
  if (props.type === "Edit") {
    setFormData(
      produce((draft) => {
        draft.productId = props.customerToEdit.productId;
        draft.name = props.customerToEdit.name;
        draft.description = props.customerToEdit.description;
      }, formData)
    );
  } else if (props.type === "Create") {
    setFormData({ description: "", name: "", productId: "" });
  }
}
