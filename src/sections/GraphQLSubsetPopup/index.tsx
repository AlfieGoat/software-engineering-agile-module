import {
  Button,
  Container,
  Header,
  Icon,
  Input,
  Textarea,
} from "@cloudscape-design/components";
import { GraphQLSubset } from "@prisma/client";
import GraphiQLExplorer from "graphiql-explorer";
import produce from "immer";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { formDataAtom } from "./atoms";
import { Content } from "./Content";
import { onSubmit } from "./onSubmit";
import { setInitialFormData } from "./setInitialFormData";

import { buildSchema } from "graphql";
import "./graphiql-explorer.d.ts";

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
  const sourceGraphQLSchema = api.sourceGraphQLSchema.getLatest.useQuery();

  const { buttonText, headingText } = Content[props.type];

  const [formData, setFormData] = useAtom(formDataAtom);

  useEffect(() => {
    setInitialFormData(props, setFormData, formData);
  }, []);

  const [query, setQuery] = useState("{}");

  const extractMinimumGraphQLSchemaFromQuery =
    api.sourceGraphQLSchema.extractMinimumGraphQLSchemaFromQuery.useMutation(
      {}
    );

  if (sourceGraphQLSchema.isLoading || !sourceGraphQLSchema.data) return <></>;

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <div className="flex space-x-4">
              <Button
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
          <GraphiQLExplorer
            query={query}
            showAttribution={false}
            explorerIsOpen={true}
            schema={buildSchema(sourceGraphQLSchema.data.graphQLSchema)}
            onEdit={async (query) => {
                setQuery(query);
                if(query.includes("Placeholder")) return;

                try{
                    const data =
                    await extractMinimumGraphQLSchemaFromQuery.mutateAsync({
                      query,
                    });
    
                  setFormData(
                    produce((draft) => {
                      draft.graphQLSchema = data;
                    }, formData)
                  );
                }
                catch{
                    setFormData(
                        produce((draft) => {
                          draft.graphQLSchema = "";
                        }, formData)
                      );
                }

            }}
            title=""

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
