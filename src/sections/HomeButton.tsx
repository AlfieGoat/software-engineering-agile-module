import { Button } from "@cloudscape-design/components";
import Link from "next/link";

export default () => {
  return (
    <span className="mr-4">
      <Link href="/">
        <Button className="-translate-y-1">Home</Button>
      </Link>
    </span>
  );
};
