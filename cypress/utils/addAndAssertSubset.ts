import { url } from "cypress/fixtures/url";
import { login } from "./login";

export function addAndAssertSubset() {
  login("Admin");
  cy.visit(`${url}/graphQLSubsets`);
  cy.wait(1000);

  const SUBSET_NAME = "Subset Name";

  cy.contains("Create GraphQLSubset").parent().click();
  cy.get("[name=name]").type(SUBSET_NAME, { delay: 0 });
  cy.get("[name=description]").last().type("Subset description", { delay: 0 });
  cy.get("[data-field-name=Tweet]").click();
  cy.get("[data-field-name=body]").click();
  cy.get("[data-field-name=id]").click();
  cy.get("[data-test=CreateSubset]").parent().click();
  cy.wait(1000);

  cy.get("[data-test=schemaContent]")
    .last()
    .contains(`type Tweet`)
    .contains("id: ID!")
    .contains("body: String");

  return { SUBSET_NAME };
}
