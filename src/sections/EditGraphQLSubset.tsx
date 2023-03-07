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
import { useState } from "react";
import { api } from "~/utils/api";

interface EditGraphQLSubsetPopupProps {
  refetchGraphQLSubsetsData: () => Promise<void>;
  closePopup: () => void;
  graphQLSubset: GraphQLSubset;
}

const EditGraphQLSubsetPopup = ({
  refetchGraphQLSubsetsData,
  closePopup,
  graphQLSubset,
}: EditGraphQLSubsetPopupProps) => {
  const graphQLSubsetCreateMutation = api.graphQLSubset.updateById.useMutation(
    {}
  );

  const [formData, setFormData] = useState({
    name: graphQLSubset.name,
    graphQLSchema: graphQLSubset.graphQLSchema,
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
                  await graphQLSubsetCreateMutation.mutateAsync({
                    graphQLSubsetId: graphQLSubset.id,
                    editedGraphQLSubset: { ...formData },
                  });
                  await refetchGraphQLSubsetsData();
                  closePopup();
                }}
              >
                Edit GraphQLSubset
              </Button>
              <button className="self-center pr-2" onClick={closePopup}>
                <Icon variant="link" name="close" />
              </button>
            </div>
          }
        >
          Edit GraphQLSubset
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

export default EditGraphQLSubsetPopup;
