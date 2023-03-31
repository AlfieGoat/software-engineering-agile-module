import { Toggle } from "@cloudscape-design/components";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { api } from "~/utils/api";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter";
import { userRoleAtom } from "./userRoleAtom";

export const ToggleUserRole = () => {
  const changeUserRoleMutation = api.user.setUserRole.useMutation();
  const sessionQuery = api.user.getCurrentRole.useQuery();

  const [currentRole, setCurrentRole] = useAtom(userRoleAtom);

  useEffect(() => {
    if (sessionQuery.data) {
      setCurrentRole(sessionQuery.data);
    }
  }, [sessionQuery.data]);

  if (!sessionQuery.data || !currentRole) return <></>;

  return (
    <Toggle
      checked={currentRole === "admin"}
      onChange={async () => {
        const newRole = await changeUserRoleMutation.mutateAsync({
          newRole: currentRole === "admin" ? "user" : "admin",
        });
        setCurrentRole(newRole);
        await sessionQuery.refetch();
      }}
      ariaLabel={`Change role to ${currentRole === "admin" ? "user" : "admin"}`}
    >
      Toggle Role - {capitalizeFirstLetter(currentRole)}
    </Toggle>
  );
};
