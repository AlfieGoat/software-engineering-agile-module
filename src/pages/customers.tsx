import { type NextPage } from "next";
import { useEffect, useState } from "react";

import Button from "@cloudscape-design/components/button";
import Cards, { type CardsProps } from "@cloudscape-design/components/cards";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import TextFilter from "@cloudscape-design/components/text-filter";

import { AppLayout, SpaceBetween } from "@cloudscape-design/components";
import { type Customer, type Product } from "@prisma/client";
import CustomHead from "~/sections/CustomHead";
import CustomerProduct from "~/sections/Customer/CustomersProduct";
import CustomerPopup from "~/sections/CustomerPopup/CreateAndEdit/index";
import { DismissibleErrorPopup } from "~/sections/DismissibleErrorPopup";
import HomeButton from "~/sections/HomeButton";
import { SchemaExplorer } from "~/sections/SchemaExplorer";
import { type Popup } from "~/sections/sharedPopup/state";
import { api } from "~/utils/api";
import { createVisibleSections } from "~/utils/cloudscapeCardUtils/createVisibleSections";
import { EmptyDisplay } from "../sections/EmptyDisplay";

const PAGE_SIZE = 8;

type Item = Customer & {
  product: Product;
};

const CARD_DEFINITION: CardsProps.CardDefinition<Item> = {
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
      header: "Product Schema Explorer",
      content: (e) => (
        <div>
          <SchemaExplorer
            schema={e.product.graphQLSchema}
            type="SchemaExplorerPropsQueryStoredInternally"
          />
        </div>
      ),
    },
  ],
};

const Home: NextPage = () => {
  const [filterText, setFilterText] = useState<string | null>(null);
  const [popupState, setPopupState] = useState<Popup>({ state: "None" });
  const [paginationIndex, setPaginationIndex] = useState(0);
  const [selectedCustomers, setSelectedCustomers] = useState<Item[]>([]);

  const customers = api.customer.getAll.useInfiniteQuery(
    { limit: PAGE_SIZE, filterText },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  const customersDeleteMutation = api.customer.deleteById.useMutation();

  // Wait until after client-side hydration to show
  const [showChild, setShowChild] = useState(false);
  useEffect(() => {
    setShowChild(true);
  }, []);
  if (!showChild) {
    return null;
  }

  return (
    <>
      <CustomHead pageName="Customers" />
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
              cardDefinition={CARD_DEFINITION}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              items={customers.data?.pages[paginationIndex]?.items ?? []}
              loadingText="Loading Customers..."
              selectionType="multi"
              trackBy="id"
              visibleSections={createVisibleSections<Item>(CARD_DEFINITION)}
              empty={<EmptyDisplay setPopupState={setPopupState} />}
              filter={
                <>
                  <TextFilter
                    filteringPlaceholder="Find customer"
                    filteringText={filterText || ""}
                    onChange={(data) => {
                      setPaginationIndex(0);
                      setFilterText(data.detail.filteringText);
                    }}
                  />
                  {[customersDeleteMutation.error?.message].map((item) => {
                    if (!item) return;
                    return (
                      <div key={item} className="mt-4">
                        <DismissibleErrorPopup error={item} />
                      </div>
                    );
                  })}
                </>
              }
              header={
                <Header
                  counter={
                    selectedCustomers.length
                      ? `(${selectedCustomers.length}/${
                          customers.data?.pages.flatMap(
                            (customer) => customer.items
                          ).length || 0
                        })`
                      : `(${
                          customers.data?.pages.flatMap(
                            (customer) => customer.items
                          ).length || 0
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
                    customers.hasNextPage && customers.data
                      ? customers.data.pages.length + 1
                      : customers.data?.pages.length || 0
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
