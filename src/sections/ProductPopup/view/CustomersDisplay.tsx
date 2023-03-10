import { Customer } from "@prisma/client";

const CustomersDisplay = ({ customers }: { customers: Customer[] }) => (
  <>
    {customers.map((customer) => (
      <div className="rounded-xl border-2 p-2">
        <span className="font-bold">{customer.name} - </span>

        <span className="text-gray-700">{customer.description}</span>
      </div>
    ))}
  </>
);

export default CustomersDisplay;
