import { type NextPage } from "next";
import { useEffect, useState } from "react";

import Button from "@cloudscape-design/components/button";
import Cards, { type CardsProps } from "@cloudscape-design/components/cards";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import TextFilter from "@cloudscape-design/components/text-filter";

import { AppLayout, SpaceBetween } from "@cloudscape-design/components";
import { type GraphQLSubset, type Product } from "@prisma/client";
import CustomerProduct from "~/sections/Customer/CustomersProduct";
import CustomHead from "~/sections/CustomHead";
import { EmptyDisplay } from "~/sections/EmptyDisplay";
import GraphQLSubsetPopup from "~/sections/GraphQLSubsetPopup/CreateAndEdit";
import HomeButton from "~/sections/HomeButton";
import { type Popup } from "~/sections/sharedPopup/state";
import { api } from "~/utils/api";
import { createVisibleSections } from "~/utils/cloudscapeCardUtils/createVisibleSections";

const PAGE_SIZE = 8;

type Item = GraphQLSubset & {
  products: Product[];
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
      id: "products",
      header: "Products using this subset",
      content: (e) =>
        e.products.map((product) => (
          <li className="list-inside list-disc" key={product.id}>
            <CustomerProduct
              productId={product.id}
              productName={product.name}
            />
          </li>
        )),
    },
    {
      id: "schema",
      header: "Schema",
      content: (e: GraphQLSubset) => (
        <div className="whitespace-pre-wrap">{e.graphQLSchema}</div>
      ),
    },
  ],
};

const Home: NextPage = () => {
  const [filterText, setFilterText] = useState<string | null>(null);
  const [paginationIndex, setPaginationIndex] = useState(0);
  const [popupState, setPopupState] = useState<Popup>({ state: "None" });
  const [selectedGraphQLSubset, setSelectedGraphQLSubset] = useState<Item[]>(
    []
  );

  const graphQLSubset = api.graphQLSubset.getAll.useInfiniteQuery(
    { limit: PAGE_SIZE, filterText },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const graphQLSubsetDeleteMutation =
    api.graphQLSubset.deleteById.useMutation();

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
      <CustomHead pageName="Subsets" />
      <main className="flex min-h-screen flex-col ">
        <AppLayout
          content={
            <Cards
              variant="full-page"
              onSelectionChange={({ detail }) =>
                setSelectedGraphQLSubset(detail.selectedItems)
              }
              selectedItems={selectedGraphQLSubset}
              loading={graphQLSubset.isLoading}
              cardDefinition={CARD_DEFINITION}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              items={graphQLSubset.data?.pages[paginationIndex]?.items ?? []}
              loadingText="Loading GraphQL Subsets..."
              selectionType="multi"
              trackBy="id"
              visibleSections={createVisibleSections<Item>(CARD_DEFINITION)}
              empty={<EmptyDisplay setPopupState={setPopupState} />}
              filter={
                <TextFilter
                  filteringPlaceholder="Find subset"
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
                    selectedGraphQLSubset.length
                      ? `(${selectedGraphQLSubset.length}/${
                          graphQLSubset.data?.pages?.flatMap(
                            (graphQLSubset) => graphQLSubset.items
                          ).length || 0
                        })`
                      : `(${
                          graphQLSubset.data?.pages?.flatMap(
                            (graphQLSubset) => graphQLSubset.items
                          ).length || 0
                        })`
                  }
                  actions={
                    <SpaceBetween size="xs" direction="horizontal">
                      <Button
                        disabled={selectedGraphQLSubset.length !== 1}
                        onClick={() => {
                          setPopupState({
                            state: "Edit",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={selectedGraphQLSubset.length < 1}
                        onClick={async () => {
                          await Promise.all(
                            selectedGraphQLSubset.map((graphQLSubset) =>
                              graphQLSubsetDeleteMutation.mutateAsync({
                                graphQLSubsetId: graphQLSubset.id,
                              })
                            )
                          );
                          setSelectedGraphQLSubset([]);
                          await graphQLSubset.refetch();
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setPopupState({ state: "Create" });
                        }}
                      >
                        Create GraphQLSubset
                      </Button>
                    </SpaceBetween>
                  }
                >
                  <HomeButton />
                  GraphQL Subsets
                </Header>
              }
              pagination={
                <Pagination
                  currentPageIndex={paginationIndex + 1}
                  pagesCount={
                    graphQLSubset.hasNextPage && graphQLSubset.data
                      ? graphQLSubset.data?.pages.length + 1
                      : graphQLSubset.data?.pages.length || 0
                  }
                  onNextPageClick={async () => {
                    await graphQLSubset.fetchNextPage();
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
          <div className="absolute top-0 left-1/2 z-10 w-1/2 -translate-x-1/2 translate-y-16 transform">
            <GraphQLSubsetPopup
              type="Create"
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
              refetchGraphQLSubsetsData={
                graphQLSubset.refetch as () => Promise<any>
              }
              removeSelected={() => {
                setSelectedGraphQLSubset([]);
              }}
            />
          </div>
        )}
        {popupState.state === "Edit" && selectedGraphQLSubset[0] && (
          <div className="absolute top-0 left-1/2 z-10 w-1/2 -translate-x-1/2 translate-y-16 transform">
            <GraphQLSubsetPopup
              type="Edit"
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
              refetchGraphQLSubsetsData={
                graphQLSubset.refetch as () => Promise<any>
              }
              removeSelected={() => {
                setSelectedGraphQLSubset([]);
              }}
              graphQLSubsetToEdit={selectedGraphQLSubset[0]}
            />
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
