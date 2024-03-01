
export const exampleSchema = `type Tweet {
  id: ID!
  # The tweet text. No more than 140 characters!
  body: String
}

type Query {
  Tweet(id: ID!): Tweet
  Tweets(limit: Int, skip: Int, sort_field: String, sort_order: String): [Tweet]
}
`;
