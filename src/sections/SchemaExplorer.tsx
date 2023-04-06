import { buildSchema, type GraphQLSchema } from "graphql";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import GraphiQLExplorer from "./Explorer";

interface SchemaExplorerPropsQueryStoredExternally {
  onEdit: (query: string) => void;
  schema?: string;
  query: string;
  type: "SchemaExplorerPropsQueryStoredExternally";
}

interface SchemaExplorerPropsQueryStoredInternally {
  schema?: string;
  type: "SchemaExplorerPropsQueryStoredInternally";
}

type SchemaExplorerProps =
  | SchemaExplorerPropsQueryStoredExternally
  | SchemaExplorerPropsQueryStoredInternally;

export const SchemaExplorer = (props: SchemaExplorerProps) => {
  const sourceGraphQLSchema = api.sourceGraphQLSchema.getLatest.useQuery(
    undefined,
    { enabled: !props.schema }
  );

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

  const [query, setQuery] = useState("{}");

  if (!schema) return <></>;

  if (props.type === "SchemaExplorerPropsQueryStoredExternally") {
    return (
      <GraphiQLExplorer
        query={props.query}
        showAttribution={false}
        explorerIsOpen={true}
        schema={schema}
        onEdit={(query: string) => {
          if (props.onEdit) props.onEdit(query);
        }}
        title=""
      />
    );
  } else if (props.type === "SchemaExplorerPropsQueryStoredInternally") {
    return (
      <GraphiQLExplorer
        query={query}
        showAttribution={false}
        explorerIsOpen={true}
        schema={schema}
        onEdit={(query: string) => {
          setQuery(query);
        }}
        title=""
      />
    );
  }

  throw new Error("Props were of incorrect type.")
};
