import { type NextPage } from "next";
import { useEffect, useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Cards from "@cloudscape-design/components/cards";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import TextFilter from "@cloudscape-design/components/text-filter";

import { AppLayout, SpaceBetween } from "@cloudscape-design/components";
import { GraphQLSubset, Product } from "@prisma/client";
import CustomHead from "~/sections/CustomHead";
import HomeButton from "~/sections/HomeButton";
import ProductPopup from "~/sections/ProductPopup/index";
import { api } from "~/utils/api";

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
  const products = api.product.getAll.useInfiniteQuery(
    { limit: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const [popupState, setPopupState] = useState<Popup>({ state: "None" });

  const productsDeleteMutation = api.product.deleteById.useMutation();

  const [selectedProducts, setSelectedProducts] = useState<
    Array<
      Product & {
        subsets: GraphQLSubset[];
      }
    >
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

  if (!products.data) return null;

  return (
    <>
      <CustomHead />
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
              cardDefinition={{
                header: (e) => e.name,
                sections: [
                  {
                    id: "createdAt",
                    header: "Created At",
                    content: (e) => e.createdAt.toLocaleString(),
                  },
                  {
                    id: "graphQLSubsets",
                    header: "GraphQL Subsets",
                    content: (e) =>
                      e.subsets.map((subset) => (
                        <li className="list-inside list-disc">{subset.name}</li>
                      )),
                  },
                  {
                    id: "graphQLSchema",
                    header: "GraphQL Schema",
                    content: (e) => (
                      <div className="whitespace-pre-wrap">
                        {e.graphQLSchema}
                      </div>
                    ),
                  },
                ],
              }}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              items={products.data.pages[paginationIndex]?.items ?? []}
              loadingText="Loading Products..."
              selectionType="multi"
              trackBy="id"
              visibleSections={["createdAt", "graphQLSubsets", "graphQLSchema"]}
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
                    selectedProducts.length
                      ? `(${selectedProducts.length}/${
                          products.data.pages.flatMap(
                            (product) => product.items
                          ).length
                        })`
                      : `(${
                          products.data.pages.flatMap(
                            (product) => product.items
                          ).length
                        })`
                  }
                  actions={
                    <SpaceBetween size="xs" direction="horizontal">
                      <Button
                        data-testid="header-btn-view-details"
                        disabled={selectedProducts.length !== 1}
                      >
                        View details
                      </Button>
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
                    products.hasNextPage
                      ? products.data.pages.length + 1
                      : products.data.pages.length
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
