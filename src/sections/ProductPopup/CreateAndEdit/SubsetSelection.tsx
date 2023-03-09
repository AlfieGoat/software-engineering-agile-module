import { Checkbox, Pagination } from "@cloudscape-design/components";
import produce from "immer";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { formDataAtom, graphQLSubsetComponentLoadingAtom } from "./atoms";
import { PAGE_SIZE } from "./index";

export const SubsetSelection = () => {
  const [, setGraphQLSubsetComponentLoading] = useAtom(
    graphQLSubsetComponentLoadingAtom
  );

  const [formData, setFormData] = useAtom(formDataAtom);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data, isLoading, hasNextPage, fetchNextPage } =
    api.graphQLSubset.getAll.useInfiniteQuery(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  useEffect(() => {
    setGraphQLSubsetComponentLoading(isLoading);
  }, [isLoading]);

  if (!data) return <></>;

  return (
    <>
      <Pagination
        ariaLabels={{
          nextPageLabel: "Next page",
          previousPageLabel: "Previous page",
          pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
        }}
        currentPageIndex={currentPageIndex + 1}
        onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
        pagesCount={hasNextPage ? data?.pages.length + 1 : data?.pages.length}
        onNextPageClick={async () => {
          await fetchNextPage();
          setCurrentPageIndex(currentPageIndex + 1);
        }}
        onPreviousPageClick={() => {
          setCurrentPageIndex(currentPageIndex - 1);
        }}
      />
      {data.pages[currentPageIndex]?.items.map((graphQLSubset) => (
        <Checkbox
          key={graphQLSubset.id}
          checked={formData.graphQLSubsetIds.includes(graphQLSubset.id)}
          onChange={({ detail }) => {
            setFormData(
              produce((draft) => {
                if (detail.checked) {
                  if (draft.graphQLSubsetIds.includes(graphQLSubset.id)) return;
                  draft.graphQLSubsetIds.push(graphQLSubset.id);
                } else {
                  draft.graphQLSubsetIds = draft.graphQLSubsetIds.filter(
                    (otherGraphQLSubsets) =>
                      otherGraphQLSubsets !== graphQLSubset.id
                  );
                }
              }, formData)
            );
          }}
        >
          {graphQLSubset.name}
        </Checkbox>
      ))}
    </>
  );
};
