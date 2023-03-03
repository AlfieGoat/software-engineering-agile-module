import {
  Button,
  Container,
  Header,
  Icon,
  Input,
  Textarea,
} from "@cloudscape-design/components";
import produce from "immer";
import { useState } from "react";
import { api } from "~/utils/api";

interface CreateNewProductsProps {
  refetchProductsData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
}

const CreateNewProductPopup = ({
  refetchProductsData,
  closePopup,
}: CreateNewProductsProps) => {
  const productCreateMutation = api.product.productCreate.useMutation({});

  const [formData, setFormData] = useState({
    name: "",
    graphQLSchema: "",
  });

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <div className="flex space-x-4">
              <Button
                onClick={async () => {
                  await productCreateMutation.mutateAsync(formData);
                  await refetchProductsData();
                  closePopup();
                }}
              >
                Create Product
              </Button>
              <button className="self-center pr-2" onClick={closePopup}>
                <Icon variant="link" name="close" />
              </button>
            </div>
          }
        >
          Create Product
        </Header>
      }
    >
      <div className="flex flex-col p-2">
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
          placeholder="Product Name"
        />
        <Textarea
          onChange={(event) => {
            setFormData(
              produce(formData, (draft) => {
                draft.graphQLSchema = event.detail.value;
              })
            );
          }}
          name="graphQLSchema"
          value={formData.graphQLSchema}
          placeholder="GraphQL Schema"
        />
      </div>
    </Container>
  );
};

export default CreateNewProductPopup;
