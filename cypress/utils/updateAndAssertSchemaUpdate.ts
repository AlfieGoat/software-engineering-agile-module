import { exampleSchema } from "cypress/fixtures/exampleSchema";
import { url } from "cypress/fixtures/url";
import { login } from "./login";

export function updateAndAssertSchemaUpdate() {
  login("Admin");
  cy.visit(`${url}/sourceGraphQLSchema`);

  cy.contains("Update Schema").parent().click();
  cy.get("textarea").type(" ", { delay: 0 });
  cy.contains("Update schema").parent().click();

  cy.get(".whitespace-pre").last().should("have.text", " ");

  cy.contains("Update Schema").parent().click();
  cy.get("textarea").type(exampleSchema, { delay: 0 });
  cy.contains("Update schema").parent().click();

  cy.get(".whitespace-pre").last().should("have.text", exampleSchema);
}
