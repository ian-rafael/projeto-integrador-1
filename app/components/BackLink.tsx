import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Link, useLocation } from "@remix-run/react";

export default function BackLink () {
  const location = useLocation();
  return (
    <Link to={".." + location.search}>
      <ArrowLeftIcon/>
    </Link>
  );
}
