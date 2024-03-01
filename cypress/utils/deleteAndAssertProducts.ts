import { url } from "cypress/fixtures/url";
import { login } from "./login";

export function deleteAndAssertProducts() {
  login("Regular");
  cy.visit(`${url}/products`);

  cy.get("[type=checkbox]").last().click();
  cy.contains("Delete").parent().click();
  cy.contains("No resources");
}
