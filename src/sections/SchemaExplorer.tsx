import { buildSchema, type GraphQLSchema } from "graphql";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import GraphiQLExplorer from "./Explorer";

export const SchemaExplorer = (props: {
  onEdit?: (query: string) => void;
  schema?: string;
}) => {
  const sourceGraphQLSchema = api.sourceGraphQLSchema.getLatest.useQuery(
    undefined,
    { enabled: !props.schema }
  );

  const [query, setQuery] = useState("{}");

  const [schema, setSchema] = useState<GraphQLSchema | null>(null);

  useEffect(() => {
    if (props.schema) {
      setSchema(buildSchema(props.schema));
      return;
    }
    if (sourceGraphQLSchema.data) {
      setSchema(buildSchema(sourceGraphQLSchema.data.graphQLSchema));
      return;
    }
  }, [sourceGraphQLSchema.data, props.schema]);

  if (!schema) return <></>;

  return (
    <GraphiQLExplorer
      query={query}
      showAttribution={false}
      explorerIsOpen={true}
      schema={schema}
      onEdit={(query: string) => {
        setQuery(query);
        if (props.onEdit) props.onEdit(query);
      }}
      title=""
    />
  );
};
