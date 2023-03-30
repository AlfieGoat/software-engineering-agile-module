import { Alert } from "@cloudscape-design/components";
import { useState } from "react";

export const DismissibleErrorPopup = ({ error }: { error: string }) => {
  const [show, setShow] = useState(true);

  if (show) {
    return (
      <Alert
        dismissible={true}
        type="error"
        key={error}
        onDismiss={() => setShow(false)}
      >
        {error}
      </Alert>
    );
  } else {
    return <></>;
  }
};
