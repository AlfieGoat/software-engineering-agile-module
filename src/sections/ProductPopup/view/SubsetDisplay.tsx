import Header from "@cloudscape-design/components/header";
import { GraphQLSubset } from "@prisma/client";
import produce from "immer";
import { useState } from "react";

export default function SubsetDisplay({subsets}: {subsets: GraphQLSubset[]}) {
  const [subsetSchemasToShow, setSubsetSchemasToShow] = useState<string[]>([]);

  return (
    <div>
      {subsets.map((subset) => {
        const showSubsetSchema = subsetSchemasToShow.includes(subset.id);
        return (
          <div className="my-2 max-h-96 overflow-y-auto rounded-xl border-2 p-2">
            <div className="flex items-center justify-between">
              <span className="font-bold">{subset.name}</span>
              {showSubsetSchema ? (
                <button
                  className="mr-2 rounded-full bg-blue-700 px-2 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-800"
                  onClick={() => {
                    setSubsetSchemasToShow(
                      subsetSchemasToShow.filter(
                        (schema) => schema !== subset.id
                      )
                    );
                  }}
                >
                  Hide GraphQL Subset Schema
                </button>
              ) : (
                <button
                  className="mr-2 rounded-full bg-blue-700 px-2 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-800"
                  onClick={() => {
                    setSubsetSchemasToShow(
                      produce((draft) => {
                        draft.push(subset.id);
                      }, subsetSchemasToShow)
                    );
                  }}
                >
                  Show GraphQL Subset Schema
                </button>
              )}
            </div>
            {showSubsetSchema && (
              <div className="mt-2 whitespace-pre rounded bg-gray-100 p-2">
                {subset.graphQLSchema}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
