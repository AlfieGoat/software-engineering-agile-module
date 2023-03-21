import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import { type Dispatch, type SetStateAction } from "react";
import { type Popup } from "./sharedPopup/state";

export function EmptyDisplay({
  setPopupState,
}: {
  setPopupState: Dispatch<SetStateAction<Popup>>;
}) {
  return (
    <Box textAlign="center" color="inherit">
      <b>No resources</b>
      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
        No resources to display.
      </Box>
      <Button
        onClick={() => {
          setPopupState({ state: "Create" });
        }}
      >
        Create resource
      </Button>
    </Box>
  );
}
