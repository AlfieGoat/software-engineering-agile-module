import { type CardsProps } from "@cloudscape-design/components";

export function createVisibleSections<T>(
  cardDefinition: CardsProps.CardDefinition<T>
) {
  if (!cardDefinition.sections)
    throw new Error("CARD_DEFINTIONS has no sections");
  return cardDefinition.sections.map((section) => {
    if (!section.id) throw new Error("Section is missing id.");
    return section.id;
  });
}
