import { Icon } from "@cloudscape-design/components";
import Header from "@cloudscape-design/components/header";
import { GraphQLSubset, Product } from "@prisma/client";
import produce from "immer";
import { useState } from "react";

interface ViewProductPopupProps {
  product: Product & {
    subsets: GraphQLSubset[];
  };
  closePopup: () => void;
}

const ViewProductPopup = ({ closePopup, product }: ViewProductPopupProps) => {
  const [subsetSchemasToShow, setSubsetSchemasToShow] = useState<string[]>([]);

  return (
    <div className="fixed top-1/2 left-1/2 z-10 h-screen -translate-x-1/2 -translate-y-1/2 transform   p-16">
      <div className=" max-h-[80vh] min-h-[300px] w-[90vw] overflow-y-scroll border bg-white p-8 shadow-2xl sm:w-[600px]">
        <div className="flex items-start">
          <Header variant="h2" description={product.description}>
            {product.name}
          </Header>
          <button className="p-2" onClick={closePopup}>
            <Icon variant="link" name="close" />
          </button>
        </div>
        <div>
          <Header variant="h3">Product GraphQL Subsets</Header>
          {product.subsets.map((subset) => {
            const showSubsetSchema = subsetSchemasToShow.includes(subset.id);
            return (
              <div className="rounded-xl border-2 overflow-y-auto max-h-96 p-2 my-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">{subset.name}</span>
                {showSubsetSchema ? (
                  <button
                    className="mr-2 rounded-full bg-blue-700 px-2 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-800"
                    onClick={() => {
                      setSubsetSchemasToShow(
                        subsetSchemasToShow.filter(
                          (schema) => schema !== subset.id
                        )
                      );
                    }}
                  >
                    Hide GraphQL Subset Schema
                  </button>
                ) : (
                  <button
                    className="mr-2 rounded-full bg-blue-700 px-2 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-800"
                    onClick={() => {
                      setSubsetSchemasToShow(
                        produce((draft) => {
                          draft.push(subset.id);
                        }, subsetSchemasToShow)
                      );
                    }}
                  >
                    Show GraphQL Subset Schema
                  </button>
                )}
              </div>
                {showSubsetSchema && <div className="whitespace-pre bg-gray-100 rounded mt-2 p-2">{subset.graphQLSchema}</div>}</div>
            );
          })}
        </div>
        <div>
          <Header variant="h3">Product Schema</Header>
          <div className="whitespace-pre-wrap">{product.graphQLSchema}</div>
        </div>
      </div>
    </div>
  );
};

const SubsetSchema = () => {};

export default ViewProductPopup;
