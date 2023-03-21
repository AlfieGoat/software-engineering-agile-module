import Head from "next/head";

export default function CustomHead({ pageName }: { pageName?: string }) {
  return (
    <Head>
      <title>{`${
        pageName ? `${pageName} - ` : ""
      }GraphQL Product Builder`}</title>
      <meta name="description" content="GraphQL Product builder" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
