import GraphiQLExplorer from "graphiql-explorer";
import { composeAndValidate, buildFederatedSchema, buildSubgraphSchema } from "@apollo/federation";
import { buildSchema, parse } from "graphql";
import { useState } from "react";
import { api } from "~/utils/api";

export const SchemaExplorer = (props: {
  onEdit?: (query: string) => void;
  schema?: string;
}) => {
  const sourceGraphQLSchema = api.sourceGraphQLSchema.getLatest.useQuery(
    undefined,
    { enabled: !props.schema }
  );

  const [query, setQuery] = useState("{}");
  if (
    !props.schema &&
    (sourceGraphQLSchema.isLoading || !sourceGraphQLSchema.data)
  )
    return <></>;

    console.log(buildSchema(
      props.schema ? props.schema : sourceGraphQLSchema.data!.graphQLSchema)
    )
  return (
    <GraphiQLExplorer
      query={query}
      showAttribution={false}
      explorerIsOpen={true}
      schema={
        buildSchema(
        props.schema ? props.schema : sourceGraphQLSchema.data!.graphQLSchema)
    }
      onEdit={(query) => {
        setQuery(query);
        if (props.onEdit) props.onEdit(query);
      }}
      title=""
    />
  );
};
