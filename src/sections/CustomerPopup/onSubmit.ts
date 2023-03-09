import { api } from "~/utils/api";
import { FormData } from "./atoms";
import { CreateNewCustomerProps, EditCustomerProps } from "./index";

export const onSubmit = async (
  formData: FormData,
  props: CreateNewCustomerProps | EditCustomerProps,
  productCreateMutation: ReturnType<typeof api.customer.create.useMutation>,
  productUpdateMutation: ReturnType<typeof api.customer.updateById.useMutation>
) => {
  if (props.type === "Create") {
    await productCreateMutation.mutateAsync({
      name: formData.name,
      productId: formData.productId,
      description: formData.description,
    });
  } else {
    await productUpdateMutation.mutateAsync({
      customerId: props.customerToEdit.id,
      editedCustomer: {
        name: formData.name,
        productId: formData.productId,
        description: formData.description,
      },
    });
  }
  await props.refetchCustomersData();
  props.closePopup();
  props.removeSelected();
};
