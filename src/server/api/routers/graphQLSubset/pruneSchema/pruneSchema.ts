import { visit, type ASTVisitor, type DocumentNode } from "graphql";
import produce from "immer";
import { type Argument, type Field } from "../produceAllowList/types";

export function pruneSchema(
  parsedSourceGraphQLSchema: DocumentNode,
  allowList: Record<string, Field[]>,
  argumentAllowList: Record<string, Argument[]>
) {
  const prunedSchema = produce(parsedSourceGraphQLSchema, (draft) => {
    // Filter out definitions not in the allow list
    draft.definitions = draft.definitions.filter((definition) => {
      if (
        definition.kind === "ObjectTypeDefinition" ||
        definition.kind === "InputObjectTypeDefinition" ||
        definition.kind === "InterfaceTypeDefinition"
      ) {
        return Boolean(allowList[definition.name.value]);
      }
      return true;
    });

    // Remove fields not in the allow list
    draft.definitions.forEach((definition) => {
      if (
        definition.kind === "ObjectTypeDefinition" ||
        definition.kind === "InterfaceTypeDefinition"
      ) {
        definition.fields = definition.fields?.filter((field) => {
          const typeAllowListInformation = allowList[definition.name.value];
          if (!typeAllowListInformation) return false;
          return typeAllowListInformation.some(
            (item) => field.name.value === item.fieldName
          );
        });
      } else if (definition.kind === "InputObjectTypeDefinition") {
        definition.fields = definition.fields?.filter((field) => {
          const typeAllowListInformation = allowList[definition.name.value];
          if (!typeAllowListInformation) return false;
          return typeAllowListInformation.some(
            (item) => field.name.value === item.fieldName
          );
        });
      }
    });

    // Remove arguments from fields
    draft.definitions.forEach((definition) => {
      if (
        definition.kind === "ObjectTypeDefinition" ||
        definition.kind === "InterfaceTypeDefinition"
      ) {
        definition.fields?.forEach((field) => {
          const parentTypeAllowListInformation =
            argumentAllowList[definition.name.value];
          if (!parentTypeAllowListInformation) return false;

          field.arguments = field.arguments?.filter((argument) =>
            parentTypeAllowListInformation.some(
              (allowedItem) => allowedItem.argumentName === argument.name.value
            )
          );
        });
      } else if (definition.kind === "InputObjectTypeDefinition") {
        definition.fields = definition.fields?.filter((field) => {
          const typeAllowListInformation = allowList[definition.name.value];
          if (!typeAllowListInformation) return false;
          return typeAllowListInformation.some(
            (item) => field.name.value === item.fieldName
          );
        });
      }
    });

    const typesUsedInSchema = new Set<string>();

    const visitor: ASTVisitor = {
      NamedType: {
        enter(fieldNode) {
          typesUsedInSchema.add(fieldNode.name.value);
        },
      },
    };

    visit(draft, visitor);
    draft.definitions = draft.definitions.filter((definition) => {
      if (definition.kind === "UnionTypeDefinition")
        return typesUsedInSchema.has(definition.name.value);

      if (definition.kind === "EnumTypeDefinition")
        return typesUsedInSchema.has(definition.name.value);

      if (definition.kind === "ScalarTypeDefinition")
        return typesUsedInSchema.has(definition.name.value);

      return true;
    });
  });

  return prunedSchema;
}
