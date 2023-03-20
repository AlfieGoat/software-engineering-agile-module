import { ValidPathNode } from "../collectLeafPaths/getPathsToLeaves";

export const getQueryOperation = (field: ValidPathNode[]) => {
  const topLevelAncestor = field[0];
  if (topLevelAncestor?.kind !== "OperationDefinition")
    throw new Error("Top level ancestor was not operation definition");
  switch (topLevelAncestor.operation) {
    case "query":
      return "Query";
    case "mutation":
      return "Mutation";
    case "subscription":
      return "Subscription";
  }
};
