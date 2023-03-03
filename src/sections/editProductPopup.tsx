import {
  Button,
  Container,
  Header,
  Icon,
  Input,
  Textarea,
} from "@cloudscape-design/components";
import { Product } from "@prisma/client";
import produce from "immer";
import { useState } from "react";
import { api } from "~/utils/api";

interface EditProductPopupProps {
  refetchProductsData: () => Promise<void>;
  closePopup: () => void;
  product: Product;
}

const EditProductPopup = ({
  refetchProductsData,
  closePopup,
  product,
}: EditProductPopupProps) => {
  const productCreateMutation = api.product.productEdit.useMutation({});

  const [formData, setFormData] = useState({
    name: product.name,
    graphQLSchema: product.graphQLSchema,
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
                  await productCreateMutation.mutateAsync({productId: product.id, editedProduct: {...formData}});
                  await refetchProductsData();
                  closePopup();
                }}
              >
                Edit Product
              </Button>
              <button className="self-center pr-2" onClick={closePopup}>
                <Icon variant="link" name="close" />
              </button>
            </div>
          }
        >
          Edit Product
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

export default EditProductPopup;
