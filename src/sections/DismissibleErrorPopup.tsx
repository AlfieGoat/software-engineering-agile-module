import { Alert } from "@cloudscape-design/components";
import { useState } from "react";
import { z } from "zod";
import { capitalizeFirstLetter } from "./index/capitalizeFirstLetter";

const zodErrorSchema = z
  .array(
    z.object({
      path: z.array(z.string()).min(1).max(1),
      message: z.string(),
    })
  )
  .min(1);

export const DismissibleErrorPopup = ({ error }: { error: string }) => {
  const [show, setShow] = useState(true);

  let potentialNewError: string | undefined;

  // Handle zod error json strings.
  try {
    const safeParsedError = zodErrorSchema.parse(JSON.parse(error));

    potentialNewError = safeParsedError
      .map((error) => {
        const path = error.path[0];
        if (!path) return "";
        return `${capitalizeFirstLetter(path)} ${error.message}.\n\n`;
      })
      .reduce((acc, error) => {
        return `${acc}${error}`;
      });
  } catch {}

  if (show) {
    return (
      <Alert
        dismissible={true}
        type="error"
        key={error}
        onDismiss={() => setShow(false)}
      >
        {potentialNewError ? potentialNewError : error}
      </Alert>
    );
  } else {
    return <></>;
  }
};
