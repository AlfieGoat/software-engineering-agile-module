import {
  Button,
  Container,
  Header,
  Icon,
  Input,
  Textarea,
} from "@cloudscape-design/components";
import produce from "immer";
import { useState } from "react";
import { api } from "~/utils/api";

interface CreateNewGraphQLSubsetsProps {
  refetchGraphQLSubsetsData: (...args: any[]) => Promise<void>;
  closePopup: () => void;
}

const CreateNewGraphQLSubsetPopup = ({
  refetchGraphQLSubsetsData,
  closePopup,
}: CreateNewGraphQLSubsetsProps) => {
  const graphQLSubsetCreateMutation = api.graphQLSubset.create.useMutation({});

  const [formData, setFormData] = useState({
    description: "",
    name: "",
    graphQLSchema: "",
  });

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <div className="flex space-x-4">
              <Button
                onClick={async () => {
                  await graphQLSubsetCreateMutation.mutateAsync(formData);
                  await refetchGraphQLSubsetsData();
                  closePopup();
                }}
              >
                Create GraphQLSubset
              </Button>
              <button className="self-center pr-2" onClick={closePopup}>
                <Icon variant="link" name="close" />
              </button>
            </div>
          }
        >
          Create GraphQLSubset
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

export default CreateNewGraphQLSubsetPopup;
