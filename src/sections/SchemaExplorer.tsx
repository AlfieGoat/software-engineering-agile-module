import GraphiQLExplorer from "graphiql-explorer";
import { buildSchema } from "graphql";
import { useState } from "react";
import { api } from "~/utils/api";

export const SchemaExplorer = (props: { onEdit: (query: string) => void }) => {
  const sourceGraphQLSchema = api.sourceGraphQLSchema.getLatest.useQuery();

  const [query, setQuery] = useState("{}");
  if (sourceGraphQLSchema.isLoading || !sourceGraphQLSchema.data) return <></>;
  return (
    <GraphiQLExplorer
      query={query}
      showAttribution={false}
      explorerIsOpen={true}
      schema={buildSchema(sourceGraphQLSchema.data.graphQLSchema)}
      onEdit={(query) => {
        setQuery(query);
        props.onEdit(query);
      }}
      title=""
    />
  );
};
