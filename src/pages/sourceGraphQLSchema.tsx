import { Textarea } from "@cloudscape-design/components";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useEffect, useState } from "react";
import HomeButton from "~/sections/HomeButton";

import { api } from "~/utils/api";

export default () => {
  const sourceGraphQLSchema = api.sourceGraphQLSchema.getLatest.useQuery();
  const [showUpdateSchemaPopup, setShowUpdateSchemaPopup] = useState(false);

  // Wait until after client-side hydration to show
  const [showChild, setShowChild] = useState(false);
  useEffect(() => {
    setShowChild(true);
  }, []);
  if (!showChild) {
    return null;
  }

  return (
    <ContentLayout
      header={
        <div className="p-4">
          <SpaceBetween size="m">
            <Header
              variant="h1"
              description="This is the source of truth schema. It is the superset of every GraphQL Subset."
              actions={
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowUpdateSchemaPopup(true);
                  }}
                >
                  Update Schema
                </Button>
              }
            >
              <HomeButton />
              Source GraphQL Schema
            </Header>
          </SpaceBetween>
        </div>
      }
    >
      <div className="space-y-8">
        <Container header={<Header variant="h2">Schema</Header>}>
          {sourceGraphQLSchema.isLoading && (
            <p className="font-bold">Loading...</p>
          )}
          {!!sourceGraphQLSchema.data ? (
            <div>{sourceGraphQLSchema.data.graphQLSchema}</div>
          ) : (
            <p className="font-bold">
              No Source GraphQL Schema exists. Create one?
            </p>
          )}
        </Container>
        {sourceGraphQLSchema.data && (
          <CompareLatestSourceGraphQLSchemaWithSubsets />
        )}
      </div>
      {showUpdateSchemaPopup && (
        <UpdateSchemaPopup
          closePopup={() => {
            setShowUpdateSchemaPopup(false);
          }}
        />
      )}
    </ContentLayout>
  );
};

const CompareLatestSourceGraphQLSchemaWithSubsets = () => {
  const compareLatestSourceGraphQLSchemaWithSubsets =
    api.sourceGraphQLSchema.compareLatestSourceGraphQLSchemaWithSubsets.useQuery();

  return (
    <Container header={<Header variant="h2">Schema diff</Header>}>
      {compareLatestSourceGraphQLSchemaWithSubsets.isLoading && (
        <p className="font-bold">Loading...</p>
      )}
      {!!compareLatestSourceGraphQLSchemaWithSubsets.data ? (
        <div className="whitespace-pre">
          {
            compareLatestSourceGraphQLSchemaWithSubsets.data.diffNoColor.split(
              "added"
            )[1]
          }
        </div>
      ) : (
        "No changes!"
      )}
    </Container>
  );
};
function UpdateSchemaPopup({ closePopup }: { closePopup: () => void }) {
  const [newSchema, setNewSchema] = useState("");
  const updateSchemaMutation = api.sourceGraphQLSchema.create.useMutation();

  return (
    <div className="absolute top-1/2 left-1/2 z-10 w-1/2 -translate-x-1/2 -translate-y-1/2 transform">
      <Container
        header={
          <Header
            variant="h2"
            description="Use this to update the source of truth schema."
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  updateSchemaMutation.mutate({ graphQLSchema: newSchema });
                  closePopup();
                }}
              >
                Update schema
              </Button>
            }
          >
            Update Schema
          </Header>
        }
      >
        <Textarea
          value={newSchema}
          onChange={({ detail }) => setNewSchema(detail.value)}
        />
      </Container>
    </div>
  );
}
