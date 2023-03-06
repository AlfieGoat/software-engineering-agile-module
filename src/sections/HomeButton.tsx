import { Button } from "@cloudscape-design/components";
import Link from "next/link";

export default () => {
  return (
    <span className="mr-4">
      <Button className="-translate-y-1">
        <Link href="/">Home</Link>
      </Button>
    </span>
  );
};
