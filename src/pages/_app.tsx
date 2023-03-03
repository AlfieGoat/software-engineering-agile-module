import "@cloudscape-design/global-styles/index.css";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { LoginRedirect } from "~/sections/loginRedirect";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <LoginRedirect>
        <Component {...pageProps} />
      </LoginRedirect>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
