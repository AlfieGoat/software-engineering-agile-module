import { type DocumentNode, type TypeNode } from "graphql";
import { type FieldPathsNodes as FieldPathsNode } from "../collectLeafPaths/getPathsToLeaves";
import { getQueryOperation } from "./getQueryOperation";
import { resolveRootType } from "./resolveRootType";
import { type Field } from "./types";

export const getFieldAllowListInfo = (
  field: FieldPathsNode[],
  schema: DocumentNode
): Field => {
  const queryObjectTypeDefinition = schema.definitions.find(
    (definition) =>
      definition.kind === "ObjectTypeDefinition" &&
      definition.name.value === "Query"
  );

  if (!queryObjectTypeDefinition)
    throw new Error("Failed to find queryObjectTypeDefinition");

  if (queryObjectTypeDefinition.kind !== "ObjectTypeDefinition")
    throw new Error("Query Type Definition is not the correct kind");

  const initialState: Field = {
    type: "field",
    parentType: "",
    fieldType: getQueryOperation(field),
    fieldName: "",
  };

  const reducer = (
    state: Field,
    currentField: FieldPathsNode,
    currentIndex: number,
    array: FieldPathsNode[]
  ): Field => {
    if (
      currentField.kind === "InlineFragment" &&
      array.length === currentIndex + 1
    ) {
      const currentFieldNamedType = currentField.typeCondition;
      if (!currentFieldNamedType)
        throw new Error(
          "Expected current InlineFragment to have a named type."
        );

      return {
        parentType: state.fieldType,
        fieldType: currentField.typeCondition.name.value,
        fieldName: "",
        type: "field",
      };
    }

    const pathType = schema.definitions.find((definition) => {
      if (
        definition.kind !== "ObjectTypeDefinition" &&
        definition.kind !== "InterfaceTypeDefinition" &&
        definition.kind !== "UnionTypeDefinition"
      )
        return false;
      return definition.name.value === state.fieldType;
    });

    if (!pathType)
      throw new Error(`Couldn't find pathType for field ${state.fieldType}`);

    if (
      pathType.kind !== "ObjectTypeDefinition" &&
      pathType.kind !== "InterfaceTypeDefinition" &&
      pathType.kind !== "UnionTypeDefinition"
    )
      throw new Error(`${pathType.kind} is not of type ObjectTypeDefinition!`);

    let nextPathType: TypeNode | undefined;

    switch (currentField.kind) {
      case "Field":
        if (pathType.kind === "UnionTypeDefinition")
          throw new Error("pathType is Union!");
        nextPathType = pathType.fields?.find((field) => {
          return field.name.value === currentField.name.value;
        })?.type;
        break;
      case "InlineFragment":
        nextPathType = currentField.typeCondition;
        break;
      case "OperationDefinition":
        throw new Error("Unexpected OperationDefinition");
    }

    if (!nextPathType) {
      if (currentField.kind === "Field") {
        throw new Error(
          `Could not find nextPathType for field: ${currentField.name.value}`
        );
      } else if (currentField.kind === "InlineFragment") {
        throw new Error(`Could not find nextPathType for InlineFragment`);
      } else {
        throw new Error("Failed to find nextPathType");
      }
    }

    const resolvedType = resolveRootType(nextPathType);

    switch (currentField.kind) {
      case "Field":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: currentField.name.value,
          type: "field",
        };
      case "InlineFragment":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: "",
          type: "field",
        };
    }
  };

  const fieldAllowListInformation = field
    .slice(1)
    .reduce<Field>(reducer, initialState);

  if (!fieldAllowListInformation.fieldType)
    throw new Error("fieldType is falsy!");
  return fieldAllowListInformation;
};
