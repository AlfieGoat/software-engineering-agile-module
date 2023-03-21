import { useState } from "react";
import { api } from "~/utils/api";
import ViewProductPopup from "../ProductPopup/view";

interface CustomerProductProps {
  productId: string;
  productName: string;
}

const CustomerProduct = ({ productId, productName }: CustomerProductProps) => {
  const [showCustomerProductPopup, setShowCustomerProductPopup] =
    useState(false);

  const product = api.product.getById.useQuery({ productId });

  return (
    <>
      <button
        className="font-medium text-blue-600 hover:underline dark:text-blue-500"
        onClick={() => {
          setShowCustomerProductPopup(true);
        }}
      >
        {productName}
      </button>
      {showCustomerProductPopup && product.data && (
        <div className="">
          <ViewProductPopup
            product={product.data}
            closePopup={() => {
              setShowCustomerProductPopup(false);
            }}
          />
        </div>
      )}
    </>
  );
};

export default CustomerProduct;
