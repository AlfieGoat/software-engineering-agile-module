import {
  type ArgumentNode,
  type ASTKindToNode,
  type FieldNode,
  type InlineFragmentNode,
  type ObjectFieldNode,
  type OperationDefinitionNode,
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
  const fullPath: Array<ValidPathNode> = [];

  ancestors.forEach((ancestor) => {
    if (Array.isArray(ancestor)) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const ancestorKind: string = (ancestor as any).kind;
    if (ANCESTORS_TO_IGNORE.includes(ancestorKind)) return;
    if (!VALID_ANCESTOR_NODES.includes(ancestorKind))
      throw new Error(`Ancestor was incorrect kind, found: ${ancestorKind}.`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    fullPath.push(ancestor as any);
  });
  if (!VALID_ANCESTOR_NODES.includes(node.kind))
    throw new Error(`Node was incorrect kind, found: ${node.kind}`);
  fullPath.push(node);
  return fullPath;
}
