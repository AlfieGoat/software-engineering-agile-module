import { type Customer } from "@prisma/client";

const CustomersDisplay = ({ customers }: { customers: Customer[] }) => (
  <>
    {customers.length === 0 && <p>No customers on this product... </p>}
    {customers.map((customer) => (
      <div key={customer.id} className="rounded-xl border-2 p-2">
        <span className="font-bold">{customer.name} - </span>

        <span className="text-gray-700">{customer.description}</span>
      </div>
    ))}
  </>
);

export default CustomersDisplay;
