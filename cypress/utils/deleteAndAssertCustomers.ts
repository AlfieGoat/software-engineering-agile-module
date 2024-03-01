import { url } from "cypress/fixtures/url";
import { login } from "./login";

export function deleteAndAssertCustomers() {
  login("Regular");
  cy.visit(`${url}/customers`);

  cy.get("[type=checkbox]").last().click();
  cy.contains("Delete").parent().click();
  cy.contains("No resources");
}
