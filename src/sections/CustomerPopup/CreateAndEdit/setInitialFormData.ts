import produce from "immer";
import { type FormData } from "./atoms";
import { type CreateNewCustomerProps, type EditCustomerProps } from "./index";

export function setInitialFormData(
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
