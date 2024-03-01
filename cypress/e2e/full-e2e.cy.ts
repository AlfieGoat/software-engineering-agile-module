/// <reference types="cypress" />

import { url } from "cypress/fixtures/url";
import { addAndAssertSubset } from "../utils/addAndAssertSubset";
import { createAndAssertCustomers } from "../utils/createAndAssertCustomers";
import { createAndAssertProduct } from "../utils/createAndAssertProduct";
import { deleteAndAssertCustomers } from "../utils/deleteAndAssertCustomers";
import { deleteAndAssertProducts } from "../utils/deleteAndAssertProducts";
import { deleteAndAssertSubset } from "../utils/deleteAndAssertSubset";
import { login } from "../utils/login";
import { updateAndAssertSchemaUpdate } from "../utils/updateAndAssertSchemaUpdate";


describe("Full E2E", () => {
  it("Regular user only has products and customer pages", () => {
    login("Regular");
    cy.visit(url);
    cy.get("[data-test=main-page-links] a").should("have.length", 2);

    cy.get("[data-test=main-page-links] a")
      .first()
      .should("have.text", "Products");

    cy.get("[data-test=main-page-links] a")
      .last()
      .should("have.text", "Customers");
  });

  it("Regular users should not be able to access the GraphQL Source Schema", () => {
    login("Regular");
    cy.request({
      url: `${url}/api/trpc/sourceGraphQLSchema.getLatest?batch=1&input={"0":{"json":null,"meta":{"values":["undefined"]}}}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).equal(401);
    });
  });

  it("Regular users should not be able to access the GraphQL Subsets", () => {
    login("Regular");
    cy.request({
      url: `${url}/api/trpc/sourceGraphQLSchema.compareLatestSourceGraphQLSchemaWithSubsets?batch=1&input={"0":{"json":null,"meta":{"values":["undefined"]}}}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).equal(401);
    });
  });

  it("Admin user has access to all pages", () => {
    login("Admin");
    cy.visit(url);
    cy.get("[data-test=main-page-links] a").should("have.length", 4);

    cy.get("[data-test=main-page-links] a")
      .first()
      .should("have.text", "Source Schema");

    cy.get("[data-test=main-page-links] a")
      .last()
      .should("have.text", "Customers");
  });

  it("Admin users can update the schemas", () => {
    updateAndAssertSchemaUpdate();
  });

  it("Admin users can add subsets", () => {
    addAndAssertSubset();
  });

  it("Admin users can delete subsets", () => {
    deleteAndAssertSubset();
  });

  it("Regular users can not create subset schemas", () => {
    login("Regular");
    cy.request({
      url: `${url}/api/trpc/graphQLSubset.create?batch=1`,
      failOnStatusCode: false,
      method: "POST",
      body: {
        "0": {
          json: {
            description: "test",
            name: "test",
            graphQLSchema:
              "type Tweet {\n  id: ID!\n}\n\ntype Query {\n  Tweet(id: ID!): Tweet\n}\n",
            query: 'query MyQuery {\n  Tweet(id: "") {\n    id\n  }\n}\n',
          },
        },
      },
    }).then((response) => {
      expect(response.status).equal(401);
    });
  });

  it("Users can add products", () => {
    createAndAssertProduct();
    deleteAndAssertProducts();
    deleteAndAssertSubset();
  });

  it("Users can add customers", () => {
    createAndAssertCustomers();
    deleteAndAssertCustomers();
    deleteAndAssertProducts();
    deleteAndAssertSubset();
  });
});
