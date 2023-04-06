import { type NextPage } from "next";
import { useEffect, useState } from "react";

import Button from "@cloudscape-design/components/button";
import Cards, { type CardsProps } from "@cloudscape-design/components/cards";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import TextFilter from "@cloudscape-design/components/text-filter";

import { AppLayout, SpaceBetween } from "@cloudscape-design/components";
import {
  type Customer,
  type GraphQLSubset,
  type Product,
} from "@prisma/client";
import CustomHead from "~/sections/CustomHead";
import { EmptyDisplay } from "~/sections/EmptyDisplay";
import HomeButton from "~/sections/HomeButton";
import ProductPopup from "~/sections/ProductPopup/CreateAndEdit/index";
import CustomersDisplay from "~/sections/ProductPopup/view/CustomersDisplay";
import SubsetDisplay from "~/sections/ProductPopup/view/SubsetDisplay";
import { SchemaExplorer } from "~/sections/SchemaExplorer";
import { type Popup } from "~/sections/sharedPopup/state";
import { api } from "~/utils/api";
import { createVisibleSections } from "~/utils/cloudscapeCardUtils/createVisibleSections";

const PAGE_SIZE = 8;

type Item = Product & {
  subsets: GraphQLSubset[];
  customers: Customer[];
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
      id: "customers",
      header: "Customers",
      content: (e) => <CustomersDisplay customers={e.customers} />,
    },
    {
      id: "graphQLSubsets",
      header: "GraphQL Subsets",
      content: (e) => <SubsetDisplay subsets={e.subsets} />,
    },
    {
      id: "graphQLSchema",
      header: "GraphQL Schema",
      content: (e) => (
        <div className="whitespace-pre-wrap">{e.graphQLSchema}</div>
      ),
    },
    {
      id: "schemaExplorer",
      header: "Product Schema Explorer",
      content: (e) => (
        <div>
          <SchemaExplorer
            schema={e.graphQLSchema}
            type="SchemaExplorerPropsQueryStoredInternally"
          />
        </div>
      ),
    },
  ],
};

const Home: NextPage = () => {
  const [filterText, setFilterText] = useState<string | null>(null);
  const [paginationIndex, setPaginationIndex] = useState(0);
  const [popupState, setPopupState] = useState<Popup>({ state: "None" });
  const [selectedProducts, setSelectedProducts] = useState<Item[]>([]);

  const products = api.product.getAll.useInfiniteQuery(
    { limit: PAGE_SIZE, filterText },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  const productsDeleteMutation = api.product.deleteById.useMutation();

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
      <CustomHead pageName="Products" />
      <main className="flex min-h-screen flex-col ">
        <AppLayout
          content={
            <Cards
              variant="full-page"
              onSelectionChange={({ detail }) =>
                setSelectedProducts(detail.selectedItems)
              }
              selectedItems={selectedProducts}
              loading={products.isLoading}
              cardDefinition={CARD_DEFINITION}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              items={products.data?.pages[paginationIndex]?.items ?? []}
              loadingText="Loading Products..."
              selectionType="multi"
              trackBy="id"
              visibleSections={createVisibleSections<Item>(CARD_DEFINITION)}
              empty={<EmptyDisplay setPopupState={setPopupState} />}
              filter={
                <TextFilter
                  filteringPlaceholder="Find product"
                  filteringText={filterText || ""}
                  onChange={(data) => {
                    setPaginationIndex(0);
                    setFilterText(data.detail.filteringText);
                  }}
                />
              }
              header={
                <Header
                  counter={
                    selectedProducts.length
                      ? `(${selectedProducts.length}/${
                          products.data?.pages.flatMap(
                            (product) => product.items
                          ).length || 0
                        })`
                      : `(${
                          products.data?.pages.flatMap(
                            (product) => product.items
                          ).length || 0
                        })`
                  }
                  actions={
                    <SpaceBetween size="xs" direction="horizontal">
                      <Button
                        data-testid="header-btn-edit"
                        disabled={selectedProducts.length !== 1}
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
                        disabled={selectedProducts.length < 1}
                        onClick={async () => {
                          await Promise.all(
                            selectedProducts.map((productToDelete) =>
                              productsDeleteMutation.mutateAsync({
                                productId: productToDelete.id,
                              })
                            )
                          );
                          setSelectedProducts([]);
                          await products.refetch();
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
                        Create Product
                      </Button>
                    </SpaceBetween>
                  }
                >
                  <HomeButton />
                  GraphQL Products
                </Header>
              }
              pagination={
                <Pagination
                  currentPageIndex={paginationIndex + 1}
                  pagesCount={
                    products.hasNextPage && products.data
                      ? products.data?.pages.length + 1
                      : products.data?.pages.length || 0
                  }
                  onNextPageClick={async () => {
                    await products.fetchNextPage();
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
            <ProductPopup
              type="Create"
              refetchProductsData={products.refetch as () => Promise<any>}
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
              removeSelected={() => {
                setSelectedProducts([]);
              }}
            />
          </div>
        )}
        {popupState.state === "Edit" && selectedProducts[0] && (
          <div className="absolute top-1/2 left-1/2 z-10 w-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <ProductPopup
              type="Edit"
              refetchProductsData={products.refetch as () => Promise<any>}
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
              productToEdit={{ ...selectedProducts[0] }}
              removeSelected={() => {
                setSelectedProducts([]);
              }}
            />
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
