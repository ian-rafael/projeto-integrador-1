import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";

export default function MenuButton () {
  return (
    <Link
      className="xl:hidden"
      to={`.?${new URLSearchParams({ open: "menu" })}`}
    >
      <HamburgerMenuIcon/>
    </Link>
  );
}
