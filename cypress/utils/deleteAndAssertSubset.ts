import { url } from "cypress/fixtures/url";
import { login } from "./login";

export function deleteAndAssertSubset() {
  login("Admin");
  cy.visit(`${url}/graphQLSubsets`);
  cy.get("[type=checkbox]").last().click();
  cy.contains("Delete").parent().click();
  cy.contains("No resources");
}
