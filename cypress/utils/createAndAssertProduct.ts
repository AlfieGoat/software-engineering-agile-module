import { url } from "cypress/fixtures/url";
import { addAndAssertSubset } from "./addAndAssertSubset";
import { login } from "./login";

export function createAndAssertProduct() {
  const { SUBSET_NAME } = addAndAssertSubset();
  login("Regular");
  cy.visit(`${url}/products`);
  const PRODUCT_NAME = "Product Name";

  cy.contains("Create Product").parent().click();
  cy.get("[name=name]").type(PRODUCT_NAME, { delay: 0 });
  cy.get("[name=description]").last().type("Product description", { delay: 0 });
  cy.contains(SUBSET_NAME).first().click();
  cy.contains("Create product").parent().click();

  cy.contains(PRODUCT_NAME);

  return { PRODUCT_NAME };
}
