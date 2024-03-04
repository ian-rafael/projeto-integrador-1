import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";

export default function BackLink () {
  return (
    <Link to="..">
      <ArrowLeftIcon/>
    </Link>
  );
}
