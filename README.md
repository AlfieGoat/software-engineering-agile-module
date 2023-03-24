# GraphQL Product Builder

The GraphQL Product Builder allows for bespoke GraphQL schemas to be generated.

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

Navigate to https://graphqlproductbuilder.co.uk/sourceGraphQLSchema and we can add the exhaustive schema for our GraphQL API. This 

![The Source GraphQL Schema page with the schema filled in](./documentation/SourceGraphQLSchemaWithSchema.png)

### Step 2: Create the GraphQL Subsets

We need to create a GraphQL Subset. What is a GraphQL Subset? These subsets are what make up the final product. Each subset is a subset of the complete GraphQL schema. These subsets can be composed together to form a product, where the subset schemas are merged into a single schema and stored in the product.

- Navigate to https://graphqlproductbuilder.co.uk/graphQLSubsets.
- Create a new GraphQLSubset for the base tweet information
  - Add a name for the GraphQL Subset
  - Add a description for the GraphQL Subset
  - Use the Query explorer to define the data that you want in the GraphQL Subset. This explorer visualizes the schema and you can click through the drop downs to select the kinds of queries you want the customer to be able to execute. This will generate a subset schema which you can review.
  - Press Create!
- Repeat what you just did, but for the tweet statistics
- Create one last GraphQL Subset for user information

**Creation of the Base Tweet GraphQL Subset**
![Creation of the Base Tweet GraphQL Subset](./documentation/BaseTweetGraphQLSubset.png)

I added two additional GraphQL Subsets to illustrate how you don't have to use all of the GraphQL subsets when building a product.

**Final Page showing the GraphQL Subsets**
![Final Page showing the GraphQL Subsets](./documentation/GraphQLSubsetPageWithFourSubsets.png)

### Step 3: Creating the GraphQL Product

Now we need to create the actual product that comprises of the two GraphQL Subsets.

- Navigate to https://graphqlproductbuilder.co.uk/products
- Create a new Product
  - Call it the Tweet and Statistics Product
  - Add a description
  - Select the correct GraphQL subsets
  - Press Create! 

![The Tweet and Statistics Product](./documentation/TweetAndStatisticsProduct.png)

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

`docker build -t product-builder --build-arg NEXT_PUBLIC_CLIENTVAR=clientvar .`
