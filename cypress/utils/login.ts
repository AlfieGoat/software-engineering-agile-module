export const login = (userType: "Regular" | "Admin") => {
  cy.session(userType, () => {
    cy.setCookie(
      Cypress.env("COOKIE_NAME") as string,
      Cypress.env(
        userType === "Regular" ? "REGULAR_GITHUB_TOKEN" : "ADMIN_GITHUB_TOKEN"
      ) as string,
      {
        domain: Cypress.env("DOMAIN") as string,
        httpOnly: true,
        path: "/",
        secure: false,
      }
    );
  });
};
