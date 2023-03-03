import { signIn, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

interface LoginRedirectProps {
  children: ReactNode;
}

export const LoginRedirect = (props: LoginRedirectProps) => {
  const { status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === "unauthenticated") void signIn();
  }, [sessionStatus]);

  return <>{props.children}</>;
};
