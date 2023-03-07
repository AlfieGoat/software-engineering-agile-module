import {
  Button,
  Checkbox,
  Container,
  Header,
  Icon,
  Input,
  Pagination,
} from "@cloudscape-design/components";
import produce from "immer";
import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";

const PAGE_SIZE = 4;

interface CreateNewProductsProps {
  refetchProductsData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
}

const graphQLSubsetComponentLoadingAtom = atom(true);

interface Form {
  name: string;
  graphQLSubsetIds: string[];
}

const formDataAtom = atom<Form>({
  name: "",
  graphQLSubsetIds: [],
});

const CreateNewProductPopup = ({
  refetchProductsData,
  closePopup,
}: CreateNewProductsProps) => {
  const productCreateMutation = api.product.create.useMutation({});

  const [formData, setFormData] = useAtom(formDataAtom);

  const [graphQLSubsetComponentLoading] = useAtom(
    graphQLSubsetComponentLoadingAtom
  );

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <div className="flex space-x-4">
              <Button
                onClick={async () => {
                  await productCreateMutation.mutateAsync({
                    name: formData.name,
                    graphQLSubsets: formData.graphQLSubsetIds.map(
                      (graphQLSubsetId) => ({ id: graphQLSubsetId })
                    ),
                  });
                  await refetchProductsData();
                  closePopup();
                }}
              >
                Create Product
              </Button>
              <button className="self-center pr-2" onClick={closePopup}>
                <Icon variant="link" name="close" />
              </button>
            </div>
          }
        >
          Create Product
        </Header>
      }
    >
      {graphQLSubsetComponentLoading && <>Loading...</>}
      <div
        className={`flex flex-col p-2 ${
          graphQLSubsetComponentLoading ? "none" : ""
        }`}
      >
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={(event) => {
            setFormData(
              produce(formData, (draft) => {
                draft.name = event.detail.value;
              })
            );
          }}
          className="mb-3"
          placeholder="Product Name"
        />
        <SubsetSelection />
      </div>
    </Container>
  );
};

export default CreateNewProductPopup;

const SubsetSelection = () => {
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
