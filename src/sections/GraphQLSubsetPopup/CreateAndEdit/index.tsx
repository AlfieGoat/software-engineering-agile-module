import {
  Button,
  Container,
  Header,
  Icon,
  Input,
  Textarea,
} from "@cloudscape-design/components";
import { type GraphQLSubset } from "@prisma/client";
import produce from "immer";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { formDataAtom } from "./atoms";
import { Content } from "./Content";
import { onSubmit } from "./onSubmit";
import { setInitialFormData } from "./setInitialFormData";

import { SchemaExplorer } from "../../SchemaExplorer";
import { DismissibleErrorPopup } from "../../DismissibleErrorPopup";

export interface CreateNewGraphQLSubsetsProps {
  type: "Create";
  refetchGraphQLSubsetsData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
  removeSelected: () => void;
}

export interface EditGraphQLSubsetPopupProps {
  type: "Edit";
  refetchGraphQLSubsetsData: () => Promise<void>;
  closePopup: () => void;
  graphQLSubsetToEdit: GraphQLSubset;
  removeSelected: () => void;
}

const GraphQLSubsetPopup = (
  props: CreateNewGraphQLSubsetsProps | EditGraphQLSubsetPopupProps
) => {
  const graphQLSubsetCreateMutation = api.graphQLSubset.create.useMutation({});
  const graphQLSubsetUpdateMutation = api.graphQLSubset.updateById.useMutation(
    {}
  );

  const [formData, setFormData] = useAtom(formDataAtom);
  const extractMinimumGraphQLSchemaFromQuery =
    api.graphQLSubset.extractMinimumGraphQLSchemaFromQuery.useMutation({});

  const { buttonText, headingText } = Content[props.type];

  useEffect(() => {
    setInitialFormData(props, setFormData, formData);
  }, []);

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <div className="flex space-x-4">
              <Button
                data-test="CreateSubset"
                onClick={() =>
                  onSubmit(
                    formData,
                    props,
                    graphQLSubsetCreateMutation,
                    graphQLSubsetUpdateMutation
                  )
                }
              >
                {buttonText}
              </Button>
              <button className="self-center pr-2" onClick={props.closePopup}>
                <Icon variant="link" name="close" />
              </button>
            </div>
          }
        >
          {headingText}
        </Header>
      }
    >
      <div className="flex flex-col space-y-4 p-2">
        {[
          graphQLSubsetCreateMutation.error?.message,
          graphQLSubsetUpdateMutation.error?.message,
        ].map((item) => {
          if (!item) return;
          return <DismissibleErrorPopup error={item} key={item} />;
        })}
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
          placeholder="GraphQLSubset Name"
        />
        <Textarea
          onChange={(event) => {
            setFormData(
              produce(formData, (draft) => {
                draft.description = event.detail.value;
              })
            );
          }}
          name="description"
          value={formData.description}
          placeholder="GraphQL Subset Description"
        />
        <div className="rounded-xl border-2 border-gray-400 p-4">
          <SchemaExplorer
          type="SchemaExplorerPropsQueryStoredExternally"
          query={formData.query}
            onEdit={async (query) => {
              setFormData(
                produce((draft) => {
                  draft.query = query;
                }, formData)
              );
              if (query.includes("Placeholder")) return;
              try {
                const data =
                  await extractMinimumGraphQLSchemaFromQuery.mutateAsync({
                    query,
                  });

                setFormData(
                  produce((draft) => {
                    draft.graphQLSchema = data;
                  }, formData)
                );
              } catch {
                setFormData(
                  produce((draft) => {
                    draft.graphQLSchema = "";
                  }, formData)
                );
              }
            }}
          />
        </div>
        <Textarea
          onChange={(event) => {
            setFormData(
              produce(formData, (draft) => {
                draft.graphQLSchema = event.detail.value;
              })
            );
          }}
          name="graphQLSchema"
          value={formData.graphQLSchema}
          placeholder="GraphQL Schema"
        />
      </div>
    </Container>
  );
};

export default GraphQLSubsetPopup;
