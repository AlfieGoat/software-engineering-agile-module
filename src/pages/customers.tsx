import { type NextPage } from "next";
import { useEffect, useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Cards from "@cloudscape-design/components/cards";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import TextFilter from "@cloudscape-design/components/text-filter";

import { AppLayout, SpaceBetween } from "@cloudscape-design/components";
import { Customer, Product } from "@prisma/client";
import CustomerProduct from "~/sections/Customer/CustomersProduct";
import CustomerPopup from "~/sections/CustomerPopup/CreateAndEdit/index";
import CustomHead from "~/sections/CustomHead";
import HomeButton from "~/sections/HomeButton";
import { api } from "~/utils/api";
import { SchemaExplorer } from "~/sections/SchemaExplorer";

const PAGE_SIZE = 8;

interface CreatePopupState {
  state: "Create";
}

interface EditPopupState {
  state: "Edit";
}

interface NonePopupState {
  state: "None";
}

type Popup = CreatePopupState | EditPopupState | NonePopupState;

const Home: NextPage = () => {
  const customers = api.customer.getAll.useInfiniteQuery(
    { limit: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const [popupState, setPopupState] = useState<Popup>({ state: "None" });

  const customersDeleteMutation = api.customer.deleteById.useMutation();

  const [selectedCustomers, setSelectedCustomers] = useState<
    (Customer & {
      product: Product;
    })[]
  >([]);

  const [showChild, setShowChild] = useState(false);

  const [paginationIndex, setPaginationIndex] = useState(0);

  // Wait until after client-side hydration to show
  useEffect(() => {
    setShowChild(true);
  }, []);
  if (!showChild) {
    return null;
  }

  if (!customers.data) return null;

  return (
    <>
      <CustomHead />
      <main className="flex min-h-screen flex-col ">
        <AppLayout
          content={
            <Cards
              variant="full-page"
              onSelectionChange={({ detail }) =>
                setSelectedCustomers(detail.selectedItems)
              }
              selectedItems={selectedCustomers}
              loading={customers.isLoading}
              cardDefinition={{
                header: (e) => e.name,
                sections: [
                  {
                    id: "createdAt",
                    header: "Created At",
                    content: (e) => e.createdAt.toLocaleString(),
                  },
                  {
                    id: "description",
                    header: "Description",
                    content: (e) => e.description,
                  },
                  {
                    id: "product",
                    header: "Product",
                    content: (e) => (
                      <CustomerProduct
                        productId={e.product.id}
                        productName={e.product.name}
                      />
                    ),
                  },
                  {
                    id: "schemaExplorer",
                    header:"Product Schema Explorer",
                    content: (e) => <div>
                      <SchemaExplorer schema={e.product.graphQLSchema}/>
                    </div>
                  }
                ],
              }}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              items={customers.data.pages[paginationIndex]?.items ?? []}
              loadingText="Loading Customers..."
              selectionType="multi"
              trackBy="id"
              visibleSections={["createdAt", "description", "product", "schemaExplorer"]}
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No resources</b>
                  <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                    No resources to display.
                  </Box>
                  <Button
                    onClick={() => {
                      setPopupState({ state: "Create" });
                    }}
                  >
                    Create resource
                  </Button>
                </Box>
              }
              filter={
                <TextFilter
                  filteringPlaceholder="Find resources"
                  filteringText=""
                />
              }
              header={
                <Header
                  counter={
                    selectedCustomers.length
                      ? `(${selectedCustomers.length}/${
                          customers.data.pages.flatMap(
                            (customer) => customer.items
                          ).length
                        })`
                      : `(${
                          customers.data.pages.flatMap(
                            (customer) => customer.items
                          ).length
                        })`
                  }
                  actions={
                    <SpaceBetween size="xs" direction="horizontal">
                      <Button
                        data-testid="header-btn-edit"
                        disabled={selectedCustomers.length !== 1}
                        onClick={() => {
                          setPopupState({
                            state: "Edit",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        data-testid="header-btn-delete"
                        disabled={selectedCustomers.length < 1}
                        onClick={async () => {
                          await Promise.all(
                            selectedCustomers.map((customerToDelete) =>
                              customersDeleteMutation.mutateAsync({
                                customerId: customerToDelete.id,
                              })
                            )
                          );
                          setSelectedCustomers([]);
                          await customers.refetch();
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        data-testid="header-btn-create"
                        variant="primary"
                        onClick={() => {
                          setPopupState({ state: "Create" });
                        }}
                      >
                        Create Customer
                      </Button>
                    </SpaceBetween>
                  }
                >
                  <HomeButton />
                  GraphQL Customers
                </Header>
              }
              pagination={
                <Pagination
                  currentPageIndex={paginationIndex + 1}
                  pagesCount={
                    customers.hasNextPage
                      ? customers.data.pages.length + 1
                      : customers.data.pages.length
                  }
                  onNextPageClick={async () => {
                    await customers.fetchNextPage();
                    setPaginationIndex(paginationIndex + 1);
                  }}
                  onPreviousPageClick={() => {
                    setPaginationIndex(paginationIndex - 1);
                  }}
                />
              }
            />
          }
          contentType="cards"
          toolsHide={true}
          navigationHide={true}
        />
        {popupState.state === "Create" && (
          <div className="absolute top-1/2 left-1/2 z-10 w-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <CustomerPopup
              type="Create"
              refetchCustomersData={customers.refetch as () => Promise<any>}
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
              removeSelected={() => {
                setSelectedCustomers([]);
              }}
            />
          </div>
        )}
        {popupState.state === "Edit" && selectedCustomers[0] && (
          <div className="absolute top-1/2 left-1/2 z-10 w-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <CustomerPopup
              type="Edit"
              refetchCustomersData={customers.refetch as () => Promise<any>}
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
              customerToEdit={{ ...selectedCustomers[0] }}
              removeSelected={() => {
                setSelectedCustomers([]);
              }}
            />
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
