import { type NextPage } from "next";
import { useEffect, useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Cards from "@cloudscape-design/components/cards";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import TextFilter from "@cloudscape-design/components/text-filter";

import { AppLayout, SpaceBetween } from "@cloudscape-design/components";
import { type GraphQLSubset } from "@prisma/client";
import Link from "next/link";
import CreateNewGraphQLSubsetPopup from "~/sections/createNewGraphQLSubset";
import { CustomerHead as CustomHead } from "~/sections/CustomHead";
import EditGraphQLSubsetPopup from "~/sections/editGraphQLSubset";
import { api } from "~/utils/api";
import HomeButton from "~/sections/HomeButton";

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
  const graphQLSubset = api.graphQLSubset.getAll.useInfiniteQuery(
    { limit: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const [popupState, setPopupState] = useState<Popup>({ state: "None" });

  const graphQLSubsetDeleteMutation =
    api.graphQLSubset.deleteById.useMutation();

  const [selectedGraphQLSubset, setSelectedGraphQLSubset] = useState<
    GraphQLSubset[]
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

  if (!graphQLSubset.data) return null;

  return (
    <>
      <CustomHead />
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
              cardDefinition={{
                header: (e) => e.name,
                sections: [
                  {
                    id: "createdAt",
                    header: "Created At",
                    content: (e: GraphQLSubset) => e.createdAt.toLocaleString(),
                  },
                  {
                    id: "schema",
                    header: "Schema",
                    content: (e: GraphQLSubset) => e.graphQLSchema,
                  },
                ],
              }}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              items={graphQLSubset.data.pages[paginationIndex]?.items ?? []}
              loadingText="Loading GraphQL Subsets..."
              selectionType="multi"
              trackBy="id"
              visibleSections={["createdAt", "schema"]}
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No resources</b>
                  <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                    No resources to display.
                  </Box>
                  <Button>Create resource</Button>
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
                    selectedGraphQLSubset.length
                      ? `(${selectedGraphQLSubset.length}/${
                          graphQLSubset.data.pages.flatMap(
                            (graphQLSubset) => graphQLSubset.items
                          ).length
                        })`
                      : `(${
                          graphQLSubset.data.pages.flatMap(
                            (graphQLSubset) => graphQLSubset.items
                          ).length
                        })`
                  }
                  actions={
                    <SpaceBetween size="xs" direction="horizontal">
                      <Button
                        data-testid="header-btn-view-details"
                        disabled={selectedGraphQLSubset.length !== 1}
                      >
                        View details
                      </Button>
                      <Button
                        data-testid="header-btn-edit"
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
                        data-testid="header-btn-delete"
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
                        data-testid="header-btn-create"
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
                  <HomeButton/>
                  GraphQL Subsets
                </Header>
              }
              pagination={
                <Pagination
                  currentPageIndex={paginationIndex + 1}
                  pagesCount={
                    graphQLSubset.hasNextPage
                      ? graphQLSubset.data.pages.length + 1
                      : graphQLSubset.data.pages.length
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
          <div className="absolute top-1/2 left-1/2 z-10 w-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <CreateNewGraphQLSubsetPopup
              refetchGraphQLSubsetsData={
                graphQLSubset.refetch as () => Promise<any>
              }
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
            />
          </div>
        )}
        {popupState.state === "Edit" && selectedGraphQLSubset[0] && (
          <div className="absolute top-1/2 left-1/2 z-10 w-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <EditGraphQLSubsetPopup
              refetchGraphQLSubsetsData={
                graphQLSubset.refetch as () => Promise<any>
              }
              closePopup={() => {
                setPopupState({ state: "None" });
              }}
              graphQLSubset={{ ...selectedGraphQLSubset[0] }}
            />
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
