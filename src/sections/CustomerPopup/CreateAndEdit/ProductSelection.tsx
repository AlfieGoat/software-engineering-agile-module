import { Pagination, RadioGroup } from "@cloudscape-design/components";
import produce from "immer";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { formDataAtom, productComponentLoadingAtom } from "./atoms";
import { PAGE_SIZE } from "./index";

export const ProductSelection = () => {
  const [, setProductComponentLoading] = useAtom(productComponentLoadingAtom);

  const [formData, setFormData] = useAtom(formDataAtom);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data, isLoading, hasNextPage, fetchNextPage } =
    api.product.getAll.useInfiniteQuery(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  useEffect(() => {
    setProductComponentLoading(isLoading);
  }, [isLoading, setProductComponentLoading]);

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
      <RadioGroup
        onChange={({ detail }) => {
          setFormData(
            produce((draft) => {
              draft.productId = detail.value;
            }, formData)
          );
        }}
        value={formData.productId}
        items={data.pages[currentPageIndex]?.items.map((product) => ({
          value: product.id,
          label: product.name,
        }))}
      />
    </>
  );
};
