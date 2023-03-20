import { type TypeNode } from "graphql";

export const resolveRootType = (type: TypeNode): string => {
  switch (type.kind) {
    case "ListType":
      return resolveRootType(type.type);
    case "NonNullType":
      return resolveRootType(type.type);
    case "NamedType":
      return type.name.value;
    default:
      throw new Error(`Failed to resolve type: , ${JSON.stringify(type)}`);
  }
};
