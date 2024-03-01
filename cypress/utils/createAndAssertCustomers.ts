import { url } from "cypress/fixtures/url";
import { login } from "./login";
import { createAndAssertProduct } from "./createAndAssertProduct";

export function createAndAssertCustomers() {
  const { PRODUCT_NAME } = createAndAssertProduct();
  login("Regular");
  cy.visit(`${url}/customers`);

  const CUSTOMER_NAME = "Customer Name";

  cy.contains("Create Customer").parent().click();
  cy.get("[name=name]").type(CUSTOMER_NAME, { delay: 0 });
  cy.get("[name=description]")
    .last()
    .type("Customer description", { delay: 0 });
  cy.contains(PRODUCT_NAME).first().click();
  cy.contains("Create customer").parent().click();
  cy.contains(CUSTOMER_NAME);
}
