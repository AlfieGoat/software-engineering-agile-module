jest.mock("../../../../../src/env", () => ({
    env: {
      NEXTAUTH_SECRET: "SECRET",
      DATABASE_URL: "MOCKED_URL",
      NODE_ENV: "development",
      NEXTAUTH_URL: "MOCKED_URL",
      GITHUB_CLIENT_ID: "MOCKED_CLIENT_ID",
      GITHUB_CLIENT_SECRET: "MOCKED_CLIENT_SECRET",
    },
  }));

  export {};