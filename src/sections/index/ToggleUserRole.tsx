import { Toggle } from "@cloudscape-design/components";
import { useAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { api } from "~/utils/api";
import { userRoleAtom } from "./userRoleAtom";

export const ToggleUserRole = () => {
  const changeUserRoleMutation = api.user.setUserRole.useMutation();

  const session = useSession();

  const [currentRole, setCurrentRole] = useAtom(userRoleAtom);

  useEffect(() => {
    if (session.data) setCurrentRole(session.data.user.role);
  }, [session.data]);

  if (!session.data || !currentRole) return <></>;

  return (
    <Toggle
      checked={currentRole === "admin"}
      onChange={async () => {
        const newRole = await changeUserRoleMutation.mutateAsync({
          newRole: currentRole === "admin" ? "user" : "admin",
        });
        setCurrentRole(newRole);
      }}
      ariaLabel={`Change role to ${currentRole === "admin" ? "user" : "admin"}`}
    >
      Toggle Role - {capitalizeFirstLetter(currentRole)}
    </Toggle>
  );
};

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
