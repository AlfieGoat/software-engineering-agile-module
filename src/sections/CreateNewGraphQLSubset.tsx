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
      <div className="flex flex-col p-2">
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
          placeholder="GraphQLSubset Name"
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
