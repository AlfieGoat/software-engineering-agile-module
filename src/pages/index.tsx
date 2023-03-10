import Link from "next/link";
import CustomHead from "~/sections/CustomHead";

export default () => {
  return (
    <>
      <CustomHead />
      <div className="mx-auto flex min-h-screen w-full flex-col px-1 text-gray-700 antialiased">
        <div className="mw-auto flex flex-1 flex-col items-center">
          <h1 className="mb-8 mt-48 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            The GraphQL Product Builder
          </h1>
          <p className="mb-8 text-center text-lg font-normal text-gray-500 dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48">
            The GraphQL Product Builder allows GraphQL schemas to be dynamically
            applied to each GraphQL customer. A product is built up of GraphQL
            subsets, once a product has been configured the product can be
            assigned to as many customers as you want!
          </p>
          <div className="flex space-x-4">
            {[
              { href: "sourceGraphQLSchema", text: "Source Schema" },
              { href: "graphQLSubsets", text: "GraphQL Subsets" },
              { href: "products", text: "Products" },
              { href: "customers", text: "Customers" },
            ].map((page) => {
              return (
                <Link
                  className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-center text-base font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
                  href={page.href}
                  key={page.href}
                >
                  {page.text}
                  <svg
                    className="ml-2 -mr-1 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"></path>
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="border-gray-300 py-8 text-center text-sm font-bold">
          Made by Alfie Goatcher with ❤️
        </div>
      </div>
    </>
  );
};
