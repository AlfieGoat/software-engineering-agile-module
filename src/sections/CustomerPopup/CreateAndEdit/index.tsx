import {
  Button,
  Container,
  Header,
  Icon,
  Input,
  Textarea,
} from "@cloudscape-design/components";
import { Customer, Product } from "@prisma/client";
import produce from "immer";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { api } from "~/utils/api";
import { formDataAtom, productComponentLoadingAtom } from "./atoms";
import { Content } from "./Content";
import { onSubmit } from "./onSubmit";
import { ProductSelection } from "./ProductSelection";
import { setInitialFormData } from "./setInitialFormData";

export const PAGE_SIZE = 8;

export interface CreateNewCustomerProps {
  type: "Create";
  refetchCustomersData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
  removeSelected: () => void;
}
export interface EditCustomerProps {
  type: "Edit";
  customerToEdit: Customer & {
    product: Product;
  };
  refetchCustomersData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
  removeSelected: () => void;
}

const CustomerPopup = (props: CreateNewCustomerProps | EditCustomerProps) => {
  const customerCreateMutation = api.customer.create.useMutation({});
  const customerUpdateMutation = api.customer.updateById.useMutation({});

  const contentForType = Content[props.type];

  const [formData, setFormData] = useAtom(formDataAtom);

  useEffect(() => {
    setInitialFormData(props, setFormData, formData);
  }, []);

  const [productSubsetComponentLoading] = useAtom(productComponentLoadingAtom);

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <div className="flex space-x-4">
              <Button
                onClick={() =>
                  onSubmit(
                    formData,
                    props,
                    customerCreateMutation,
                    customerUpdateMutation
                  )
                }
              >
                {contentForType.headingText}
              </Button>
              <button className="self-center pr-2" onClick={props.closePopup}>
                <Icon variant="link" name="close" />
              </button>
            </div>
          }
        >
          {contentForType.buttonText}
        </Header>
      }
    >
      <div
        className={`flex flex-col space-y-4 p-2 ${
          productSubsetComponentLoading ? "none" : ""
        }`}
      >
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={(event) => {
            setFormData(
              produce(formData, (draft) => {
                draft.name = event.detail.value;
              })
            );
          }}
          className="mb-3"
          placeholder="Customer Name"
        />
        <Textarea
          onChange={(event) => {
            setFormData(
              produce(formData, (draft) => {
                draft.description = event.detail.value;
              })
            );
          }}
          name="description"
          value={formData.description}
          placeholder="Customer Description"
        />
        <ProductSelection />
      </div>
    </Container>
  );
};

export default CustomerPopup;
