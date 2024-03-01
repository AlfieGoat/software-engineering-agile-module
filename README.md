# GraphQL Product Builder

The GraphQL Product Builder allows for bespoke GraphQL schema subsets to be generated.

Deployments of this application are accessible for easy marking:

- https://beta.graphqlproductbuilder.co.uk
- https://prod.graphqlproductbuilder.co.uk

## DevOps

### Architecture Diagram

![Architecture Diagram](./documentation/ArchitectureDiagram.png)

The above diagram shows the System architecture diagram for the GPB. Infrastructure is defined in code using AWS CDK in the `src/cdk` folder.

Route 53 handles DNS, the VPC provides networking in the cloud, the application load balancer distributes requests across the Fargate tasks based on current utilization and Fargate can scale the number of tasks up and down depending on the load, however this feature is disabled for cost savings measures in this assignment.

In the private subnet, there is a MySQL RDS cluster which provides the application servers with the database. This database can be configured to be deployed to multi-availability zones, but this is disabled in this assignment for costs savings.

### Pipeline

There is an AWS Code Pipeline which has a web hook from the Github repo. This will build and deploy any changes in the Github repo. This Code Pipeline has two deployment stages, as well as auxillary stages to handle CI/building the project. See the Appendix of this README to see a screenshot of the Code Pipeline.

### Integration Testing

The deployment stages make use of Cypress for end-to-end integration tests which tests the functionality of the website. This test works by first deploying to the Beta environment, then once the deployment has succeeded, the end-to-end integration tests will run against the live beta deployment. These tests ensure that regressions aren't introduced and functionality is maintained across all of the pages.

## Metrics and Logging

Metrics and logs are captured in multiple places

### AWS Application Load Balancer

The AWS Application Load Balancer captures extensive metrics which can be seen here:

[AWS Application Load Balancer](AWSApplicationLoadBalancer.png)

### Application Logs

Although the Application Load Balancer provides extensive metrics which can be used to alarm on, application logs provide a deeper look at individual requests.

These logs are picked up by the [`AWS logs driver`](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_awslogs.html) and logged into [AWS CloudWatch](https://aws.amazon.com/cloudwatch/), which allows for log querying and management.

All requests to the API routes are logged and include the following information:

- HTTP Request Method
- Request URL
- Request Body
- User Agent
- Response Code
- Their User ID if they are logged in

These logs are captured from the [global API middleware](./src/pages/api/trpc/[trpc].ts) for the generic attributes and the user id is captured in the [authenticated route middleware](./src/server/api/trpc.ts).

### Application Errors

Errors are captured in different places:

- Whenever an unauthorized request comes in, the server [logs the unauthorized request](./src/server/api/trpc.ts) and a 401 HTTP response code is returned to the user.
- Whenever request parameters don't match the schema for the route (including additional constraints such as string length requirements or regex validation), a 400 status code is returned and an error is logged ([example router](src/server/api/routers/customers/router.ts)).
- Whenever there is a database query error, this is logged by the [Prisma client](src/server/db.ts).

## Bootstrapping

### Pre-requisites

- PNPM must be installed
- Node must be installed
- You must have a MySQL instance running

### Steps

#### One-time setup

1. Clone this Repo
1. Run `pnpm install`
1. [Create your own Github SSO Provider](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
   - Follow the above instructions
   - Auth callback URL should be `http://localhost:3000/api/auth/callback/github`
   - Homepage URL should be `http://localhost:3000`
1. Create your own `.env` file using the `.env.example` as a template. `.env` is where your dev server will load your environment variables from. Environment variables are checked against a schema at runtime in `src/env.mjs`, so your server will spit out errors if your environment variables don't match the schema.
   1. `DATABASE_URL` should be the URL to your MySQL DB
   1. `NEXTAUTH_URL` should be `http://localhost:3000`
   1. `GITHUB_CLIENT_ID` should come from the OAuth App you just created on Github
   1. `GITHUB_CLIENT_SECRET` should come from the OAuth App you just created on Github
1. Run `npx prisma db push` to sync your Prisma schema with your MySQL DB

#### Start the dev server

1. Run `pnpm dev` to run a dev version of your application

## Background

### What is GraphQL

GraphQL is a query language built on top of a well defined schema. The schema defines all of the queries, mutations and subscriptions a client can make to a server. The schema is the contract that binds the client and the server. With GraphQL you specify the exact data you want from the server and you get the data back in exactly that format. This reduces over-fetching and reduces the amount of data that needs to be transferred over the network.

Here's an example query for a vehicle GraphQL API:

```graphql
query {
  vehicle(id: "f29012aa-38e1-468d-bfd4-b016f503a362") {
    price {
      amount
      currency
    }
    manufacturer {
      name
      country
    }
  }
}
```

This may return data in the following format:

```json
{
  "data": {
    "vehicle": {
      "price": {
        "amount": 40000,
        "currency": "gbp"
      },
      "manufacturer": {
        "name": "Mercedes",
        "country": "DE"
      }
    }
  }
}
```

### Monetizing your GraphQL API

Monetizing APIs is not a new concept, but monetizing GraphQL APIs is a more novel concept.

Imagine you have a GraphQL API within your organization and you want to monetize your API by enabling third parties to have enterprise access to your API. How would you do this? Well, you can setup a GraphQL endpoint, enter a contract with the 3rd party, exchange money and provide them with access to your API.

But there's one main problem with this - By exposing your whole GraphQL Endpoint, there is only one single GraphQL schema that is being given to every customer.

Think about the following business requirements:

- As an API provider, I want to expose a subset of data to customers who are paying less.

Exposing a subset of data isn't possible with a regular GraphQL endpoint. So how would you fulfill this business requirement? A GraphQL Product Builder.

## What is the GraphQL Product Builder (a concrete example)

Imagine you work at a Twitter and you have a GraphQL API that provides information about tweets and Twitter users. The schema for the GraphQL API that provides the data could look like this:

```graphql
type Tweet {
  id: ID!
  body: String
  date: Date
  Author: User
  Stats: Stat
}

type User {
  id: ID!
  username: String
  firstName: String
  lastName: String
  fullName: String
  avatar_Url: Url
}

type Stat {
  views: Int
  likes: Int
  retweets: Int
  responses: Int
}

scalar Url
scalar Date

type Query {
  Tweet(id: ID!): Tweet
  Tweets(limit: Int, skip: Int, sort_field: String, sort_order: String): [Tweet]
  User(id: ID!): User
}
```

The GraphQL Product Builder will be used by two job families:

- Software Development Engineers (SDE) who are familiar with the underlying Twitter GraphQL schema.
- Sales Representatives (SR) who are selling the Twitter API to customers.

The terms of a new sale have been negotiated and the sale has just been made, so access to the API needs to be provided to the customer.

The negotiations have stated that the customer is allowed to access **Tweet** information including **Tweet Statistics**, but **not data about Users** (additional monetary compensation would be required for a customer to onboard with User data).

Based on this information we can onboard the customer onto the GraphQL API. But how do we do this?

### Step 1: Add the schema to the GraphQL Product Builder

Let's add the customer to the database.

Navigate to https://graphqlproductbuilder.co.uk/sourceGraphQLSchema and we can add the exhaustive schema for our GraphQL API. This is needed because all of the GraphQL Subsets are based on this _source of truth schema_.

![The Source GraphQL Schema page with the schema filled in](./documentation/SourceGraphQLSchemaWithSchema.png)

### Step 2: Create the GraphQL Subsets

We need to create a GraphQL Subset. But why? What is a GraphQL Subset? These subsets are what make up the final product. Each subset is a chunk of the complete GraphQL schema. These subsets can be composed together to form a product, where the subset schemas are merged into a single schema and stored in the product. GraphQL Subsets can overlap.

- Navigate to https://graphqlproductbuilder.co.uk/graphQLSubsets.
- Create a new GraphQLSubset for the base tweet information
  - Add a name for the GraphQL Subset
  - Add a description for the GraphQL Subset
  - Use the Query explorer to define the data that you want in the GraphQL Subset. This explorer visualizes the schema and you can click through the drop downs to select the kinds of queries you want the customer to be able to execute. This will generate a subset schema which you can review.
  - Press Create!
- Repeat what you just did, but for the tweet statistics.

**Creation of the Base Tweet GraphQL Subset**
![Creation of the Base Tweet GraphQL Subset](./documentation/BaseTweetGraphQLSubset.png)

**Final Page showing the GraphQL Subsets**

I've added some additional subsets to show some more examples.

![Final GraphQL Subsets Page](./documentation/GraphQLSubsetPageWithFourSubsets.png)

### Step 3: Creating the GraphQL Product

Now we need to create the actual product that comprises of the two GraphQL Subsets.

- Navigate to https://graphqlproductbuilder.co.uk/products
- Create a new Product
  - Call it the Tweet and Statistics Product
  - Add a description
  - Select the correct GraphQL subsets
  - Press Create!

**Creation of The Tweet and Statistics Product**

![The Tweet and Statistics Product](./documentation/TweetAndStatisticsProduct.png)

**I've added an additional product as an extra example**

![Final GraphQL Products Page](./documentation/GraphQLProductsPage.png)

### Step 4: Create the customer

- Navigate to https://graphqlproductbuilder.co.uk/customers
- Create the customer
  - Add the customer name
  - Add the customer description
  - Select the correct GraphQL product to associate with the customer
  - Press Create!

**Creation of the customer**

![Creation of the customer](./documentation/CreateGoogleCustomer.png)

**Final GraphQL customer page**

![Final GraphQL Customers Page](./documentation/GraphQLProductsPage.png)

### Recap

The below diagram shows the complete flow of how customers gain access to a product, a product is a composition of GraphQL Subsets and how GraphQL Subsets are constructed from a chunk of the GraphQL Source Schema, as described in the steps above.

![Entity Diagram](./documentation/EntityDiagram.png)

### What happens now?

You have now uploaded the source of truth schema, you've created the underlying GraphQL Subsets, you've created the Product which is made up of the GraphQL Subsets and you've created the Customer along with the product you want them to be able to access.

This application manages the source schema, the GraphQL Subsets, the GraphQL Products and the underlying Customers, but it currently doesn't integrate with any GraphQL Gateway. The next step would be to include the customer's API key and associate it with the customer entity in the database, then the GraphQL Gateway could make a request to the Product builder to map the API key to the correct GraphQL Schema for that customer.

An example request life cycle with this integrated could look like this:

![Example Request Life Cycle](./documentation/RequestLifecycle.png)

## Next steps

### Dynamic schema per customer

As mentioned above, this application needs integrating with a GraphQL Gateway to allow for a dynamic schema per customer.

### Locking down the application

If you want to deploy this application for your GraphQL Gateway, you will need to lock this application down to only those who need it. You can do this by:

- Creating a NextJS middleware which checks that the requesting user is logged in and is allowlisted to access the website. This is a front end check.
- Creating and using a new tRPC procedure which checks if the user is logged in and allowlisted to access the queries and mutations specified.
- Remove the demonstrative user toggle switch

### Automatic schema ingestion

Whenever the underlying GraphQL schema changes, we don't want to have to manually update it. A new feature would be to allow for automatic schema ingestion. This would ensure that the GraphQL Product Builder always has the latest changes and there's no manual intervention needed.

### Integration testing GraphQL Schema updates

Whenever you want to make a change to the GraphQL schema of a subset, I want integration testing to be performed.

GraphQL Products are made up of many GraphQL Subsets by composing their GraphQL schemas into a single schema. If I make a change to one of the GraphQL subsets, it will cause the GraphQL Products to have a different schema. I want to ensure that the new resulting GraphQL Product schema is valid by the following checks:

#### Statically check it is a valid schema

This can be done by parsing the schema and checking there are no errors when parsing.

#### Statically check that it contains no breaking changes

This can be done by running it through the GraphQL schema diffing tool which finds any breaking changes.

#### Execute against the schema to test it is a valid schema

This could work by:

- GraphQL Subset test:
  - Each GraphQL subset has its own integration test query.
  - The GraphQL Product Builder will call the GraphQL Gateway with the query and a special header that overrides the schema with the schema of the GraphQL Subset.
  - The GraphQL Product Builder will receive the response
  - The GraphQL Product Builder will check that the response is a 200 and contains no errors.
  - The GraphQL Product Builder will check that the response contains data that is of the correct schema type.
  - If the GraphQL subset integration checks pass, it will move on to the GraphQL Product tests
- GraphQL Product Tests:
  - For each GraphQL Product that the edited GraphQL Subset is associated with:
    - The GraphQL Product Builder will calculate the new GraphQL schema for each product
    - For each GraphLQ Subset of each GraphQL Product
      - The GraphQL Product Builder will call the GraphQL Gateway with the GraphQL Subset integration query and a special header that overrides the schema with the schema of the new GraphQL product schema.
        - The GraphQL Product Builder will receive the response
        - The GraphQL Product Builder will check that the response is a 200 and contains no errors.
        - The GraphQL Product Builder will check that the response contains data that is of the correct schema type.
  - If every single GraphQL query succeeds and matches the correct shape, the test will pass and the edited schemas will be committed to the database

This same approach should be applied when updating a product to have different GraphQL Subsets.

#### Approval workflow

This approach does not follow the "two person rule" approach. I'd like any change made to need to go through a review process. The full details of this will need to be fleshed out.

## Technology Stack

The stack was based on [Create T3 App](https://create.t3.gg), a starting template for a full stack type-safe application. The stack includes:

- Typescript
- Next.js
- tRPC
- Prisma
- Tailwind CSS
- NextAuth.js

For more information about why these technologies were used, check out the [why](https://create.t3.gg/en/why) page.

## Project Structure

### `src/cdk`

This directory contains the infrastructure as code that defines how to deploy this application to AWS. This includes a CI/CD Pipeline which has a webhook into the Github repo and will deploy every time there has been a change to the repo.

There are the following stacks:

- Hosted Zone Stack - Contains the Hosted Zone required for DNS
- VPC Stack - Contains the Virtual Private Cloud infrastructure to provide networking in the cloud.
- Docker Image Stack - Builds the docker image
- Database Stack - Contains the RDS instance
- Fargate Stack - Contains the Application load balanced Fargate service
- Pipeline Stack - Contains resources required for the pipeline

### `cypress`

This directory contains the end-to-end testing spec.

### `src/pages/`

Contains the definitions for the routes for all the pages and the API endpoints.

### `src/sections/`

Contains the front end React components.

### `src/server/`

Contains the code that is run on the server side, including all of the routers and procedures for the API.

### `src/styles/`

Contains the global styles.

### `tst/`

Contains the jest tests.

# Appendix

## Code Pipeline Screenshot

![Code Pipeline](./documentation/AWSCodePipeline.png)
