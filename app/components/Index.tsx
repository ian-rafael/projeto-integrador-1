import { MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";
import { Link, useLocation, useResolvedPath } from "@remix-run/react";
import clsx from "clsx/lite";
import MenuButton from "./MenuButton";

type Rows = {id: string, name: string, extra?: any}[];

function List ({ rows }: { rows: Rows }) {
  return (
    <ul className="grid gap-2 py-2">
      {rows.map((data) => {
        return (
          <li className="bg-slate-300 rounded-md hover:brightness-95" key={data.id}>
            <Link
              className="block p-2"
              to={data.id}
            >
              {data.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CreateLink () {
  return (
    <Link
      className="text-blue-600 hover:underline inline-flex items-center gap-1"
      to="create"
    >
      <PlusIcon/>
      Novo registro
    </Link>
  )
}

interface IndexProps {
  title: string,
  children: React.ReactNode,
  rows: Rows;
}

export default function Index ({ title, children, rows }: IndexProps) {
  const location = useLocation();
  const path = useResolvedPath('.');
  const isIndex = location.pathname === path.pathname;
  const isMenuOpen = new URLSearchParams(location.search).get('open') === "menu";
  return (
    <div className="lg:grid lg:grid-flow-col lg:auto-cols-fr">
      <div
        className={clsx(
          "px-4 min-h-screen border-slate-300",
          "lg:border-r lg:overflow-y-auto lg:max-h-screen",
          (!isIndex || isMenuOpen) && "hidden lg:block",
        )}
      >
        <header className="mb-2 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <MenuButton/>
            <h2>{title}</h2>
            <MagnifyingGlassIcon className="invisible"/>
          </div>
        </header>
        <CreateLink/>
        <List rows={rows}/>
      </div>
      <div className={clsx(isMenuOpen && "lg:empty:hidden xl:empty:block")}>
        {children}
      </div>
    </div>
  )
}
