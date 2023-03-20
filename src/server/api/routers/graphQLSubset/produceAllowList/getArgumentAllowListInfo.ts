import { type DocumentNode, type TypeNode } from "graphql";
import { type ArgumentPathNodes } from "../collectLeafPaths/getPathsToLeaves";
import { getQueryOperation } from "./getQueryOperation";
import { resolveRootType } from "./resolveRootType";
import { type Argument, type Field } from "./types";

export const getArgumentAllowListInfo = (
  field: ArgumentPathNodes[],
  schema: DocumentNode
): Argument | Field => {
  const queryObjectTypeDefinition = schema.definitions.find(
    (definition) =>
      definition.kind === "ObjectTypeDefinition" &&
      definition.name.value === "Query"
  );

  if (!queryObjectTypeDefinition)
    throw new Error("Failed to find queryObjectTypeDefinition");

  if (queryObjectTypeDefinition.kind !== "ObjectTypeDefinition")
    throw new Error("Query Type Definition is not the correct kind");

  const initialState: Argument = {
    type: "Argument",
    parentType: "",
    fieldType: getQueryOperation(field),
    fieldName: "",
    argumentName: "",
  };

  const reducer = (
    state: Argument,
    currentNode: ArgumentPathNodes,
    currentIndex: number,
    array: ArgumentPathNodes[]
  ): Argument => {
    if (!state.fieldType || currentNode.kind === "Argument") return state;

    const pathType = schema.definitions.find((definition) => {
      if (
        definition.kind !== "ObjectTypeDefinition" &&
        definition.kind !== "InterfaceTypeDefinition" &&
        definition.kind !== "UnionTypeDefinition" &&
        definition.kind !== "InputObjectTypeDefinition"
      )
        return false;
      return definition.name.value === state.fieldType;
    });

    if (!pathType) throw new Error("Pathtype is falsy");

    if (
      pathType.kind !== "ObjectTypeDefinition" &&
      pathType.kind !== "InterfaceTypeDefinition" &&
      pathType.kind !== "InputObjectTypeDefinition"
    )
      throw new Error(`${pathType.kind} is not of type ObjectTypeDefinition`);

    const nextNode = array[currentIndex + 1];

    if (
      nextNode &&
      nextNode.kind === "Argument" &&
      array.length === currentIndex + 1 &&
      currentNode.kind !== "InlineFragment"
    ) {
      return {
        argumentName: nextNode.name.value,
        fieldName: currentNode.name?.value as string,
        type: "Argument",
        fieldType: "",
        parentType: state.fieldType,
      };
    } else if (
      nextNode &&
      nextNode.kind === "Argument" &&
      currentNode.kind !== "InlineFragment"
    ) {
      let field;
      if (pathType.kind === "InputObjectTypeDefinition") {
        field = pathType.fields?.find(
          (field) => field.name.value === currentNode.name?.value
        );
      } else {
        field = pathType.fields?.find(
          (field) => field.name.value === currentNode.name?.value
        );
      }
      // get argumentType, this should be nextPathType
      if (field?.kind === "InputValueDefinition")
        throw new Error("Found InputValueDefinition");
      const argument = field?.arguments?.find(
        (argument) => argument.name.value === nextNode.name.value
      );
      if (!argument) throw new Error("Couldn't find argument");
      const argumentType = resolveRootType(argument.type);

      return {
        argumentName: nextNode.name.value,
        type: "Argument",
        parentType: state.fieldType,
        fieldType: argumentType,
        fieldName: "",
      };
    }

    let nextPathType: TypeNode | undefined;

    switch (currentNode.kind) {
      case "Field":
        if (pathType?.kind === "InputObjectTypeDefinition")
          throw new Error("Found InputObjectTypeDefinition");

        nextPathType = pathType.fields?.find((field) => {
          return field.name.value === currentNode.name.value;
        })?.type;
        break;
      case "InlineFragment":
        nextPathType = currentNode.typeCondition;
        break;
      case "ObjectField":
        return {
          fieldType: "",
          parentType: state.fieldType,
          fieldName: currentNode.name.value,
          type: "Argument",
          argumentName: "",
        };
      case "OperationDefinition":
        throw new Error("Unexpected OperationDefinition");
    }

    if (!nextPathType) throw new Error(`nextPathType is falsy!`);

    const resolvedType = resolveRootType(nextPathType);

    switch (currentNode.kind) {
      case "Field":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: currentNode.name.value,
          type: "Argument",
          argumentName: "",
        };
      case "InlineFragment":
        return {
          fieldType: resolvedType,
          parentType: state.fieldType,
          fieldName: "",
          type: "Argument",
          argumentName: "",
        };
    }
  };

  const fieldAllowListInformation = field
    .slice(1)
    .reduce<Argument>(reducer, initialState);

  // if (!fieldAllowListInformation.fieldType)
  //   throw new Error("fieldType is falsy!");
  if (fieldAllowListInformation.argumentName === "")
    return {
      ...fieldAllowListInformation,
      type: "field",
    };
  return fieldAllowListInformation;
};
