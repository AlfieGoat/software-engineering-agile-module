import { Icon } from "@cloudscape-design/components";
import Header from "@cloudscape-design/components/header";
import {
  type Customer,
  type GraphQLSubset,
  type Product,
} from "@prisma/client";
import CustomersDisplay from "./CustomersDisplay";
import SubsetDisplay from "./SubsetDisplay";

interface ViewProductPopupProps {
  product: Product & {
    subsets: GraphQLSubset[];
    customers: Customer[];
  };
  closePopup: () => void;
}

const ViewProductPopup = ({ closePopup, product }: ViewProductPopupProps) => {
  return (
    <div className="fixed top-1/2 left-1/2 z-10 h-screen -translate-x-1/2 -translate-y-1/2 transform   p-16">
      <div className=" max-h-[80vh] min-h-[300px] w-[90vw] overflow-y-scroll border bg-white p-8 shadow-2xl sm:w-[600px]">
        <div className="flex items-start">
          <Header variant="h1" description={product.description}>
            {product.name}
          </Header>
          <button className="p-2" onClick={closePopup}>
            <Icon variant="link" name="close" />
          </button>
        </div>
        <div>
          <Header variant="h3">Product GraphQL Subsets</Header>
          <SubsetDisplay subsets={product.subsets} />
        </div>
        <div>
          <Header variant="h3">Customers</Header>
          <CustomersDisplay customers={product.customers} />
        </div>
        <div>
          <Header variant="h3">Product Schema</Header>
          <div className="whitespace-pre-wrap rounded-xl border-2 p-2">
            {product.graphQLSchema}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductPopup;
