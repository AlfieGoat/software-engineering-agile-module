import {
  ArgumentNode,
  ASTKindToNode,
  FieldNode,
  InlineFragmentNode,
  ObjectFieldNode,
  OperationDefinitionNode,
} from "graphql";

const VALID_ANCESTOR_NODES = [
  "OperationDefinition",
  "Field",
  "Argument",
  "ObjectField",
  "InlineFragment",
  "Name",
  "EnumValue",
];

const ANCESTORS_TO_IGNORE = ["SelectionSet", "Document", "ObjectValue"];

export type FieldPathsNodes =
  | FieldNode
  | OperationDefinitionNode
  | InlineFragmentNode;

export type ArgumentPathNodes =
  | ObjectFieldNode
  | ArgumentNode
  | FieldNode
  | OperationDefinitionNode
  | InlineFragmentNode;
export type ValidPathNode = ArgumentPathNodes | FieldPathsNodes;

export function getPathsToLeaves(
  ancestors: ReadonlyArray<
    | ASTKindToNode[keyof ASTKindToNode]
    | ReadonlyArray<ASTKindToNode[keyof ASTKindToNode]>
  >,
  node: ObjectFieldNode | FieldNode | ArgumentNode
) {
  let fullPath: Array<ValidPathNode> = [];

  ancestors.forEach((ancestor) => {
    if (Array.isArray(ancestor)) return;
    if (ANCESTORS_TO_IGNORE.includes((ancestor as any).kind)) return;
    if (!VALID_ANCESTOR_NODES.includes((ancestor as any).kind))
      throw new Error(
        `Ancestor was incorrect kind, found: ${(ancestor as any).kind}.`
      );
    fullPath.push(ancestor as any);
  });
  if (!VALID_ANCESTOR_NODES.includes(node.kind))
    throw new Error(`Node was incorrect kind, found: ${node.kind}`);
  fullPath.push(node);
  return fullPath;
}
