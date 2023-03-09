import {
  Button,
  Container,
  Header,
  Icon,
  Input,
} from "@cloudscape-design/components";
import { GraphQLSubset, Product } from "@prisma/client";
import produce from "immer";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { api } from "~/utils/api";
import { formDataAtom, graphQLSubsetComponentLoadingAtom } from "./atoms";
import { Content } from "./Content";
import { onSubmit } from "./onSubmit";
import { setInitialFormData } from "./setInitialFormData";
import { SubsetSelection } from "./SubsetSelection";

export const PAGE_SIZE = 8;

export interface CreateNewProductsProps {
  type: "Create";
  refetchProductsData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
  removeSelected: () => void;
}
export interface EditProductsProps {
  type: "Edit";
  productToEdit: Product & {
    subsets: GraphQLSubset[];
  };
  refetchProductsData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
  removeSelected: () => void;
}

const ProductPopup = (props: CreateNewProductsProps | EditProductsProps) => {
  const productCreateMutation = api.product.create.useMutation({});
  const productUpdateMutation = api.product.updateById.useMutation({});

  const contentForType = Content[props.type];

  const [formData, setFormData] = useAtom(formDataAtom);

  useEffect(() => {
    setInitialFormData(props, setFormData, formData);
  }, []);

  const [graphQLSubsetComponentLoading] = useAtom(
    graphQLSubsetComponentLoadingAtom
  );

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
                    productCreateMutation,
                    productUpdateMutation
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
        className={`flex flex-col p-2 ${
          graphQLSubsetComponentLoading ? "none" : ""
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
          placeholder="Product Name"
        />
        <SubsetSelection />
      </div>
    </Container>
  );
};

export default ProductPopup;
