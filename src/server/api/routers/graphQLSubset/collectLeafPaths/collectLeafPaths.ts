import { ASTNode, ASTVisitor, visit } from "graphql";
import { getPathsToLeaves, ValidPathNode } from "./getPathsToLeaves";

export function collectLeafPaths(
  rootNode: ASTNode,
  leafPaths: ValidPathNode[][]
) {
  // Define the logic for different types of AST nodes
  const visitor: ASTVisitor = {
    Field: {
      enter(fieldNode, key, parent, path, ancestors) {
        let fullPath = getPathsToLeaves(ancestors, fieldNode);
        leafPaths.push(fullPath);
      },
    },
    ObjectField: {
      enter(fieldNode, key, parent, path, ancestors) {
        let fullPath = getPathsToLeaves(ancestors, fieldNode);
        leafPaths.push(fullPath);
      },
    },
    Argument: {
      enter(fieldNode, key, parent, path, ancestors) {
        let fullPath = getPathsToLeaves(ancestors, fieldNode);
        leafPaths.push(fullPath);
      },
    },
  };

  // Visit the parsed query with the custom visitor
  visit(rootNode, visitor);
}
