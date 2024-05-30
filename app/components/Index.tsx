import { ArrowLeftIcon, MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";
import { Form, Link, useLocation, useResolvedPath, useSearchParams } from "@remix-run/react";
import { clsx } from "clsx/lite";
import MenuButton from "./MenuButton";
import { SubmitButton } from "./form";

type Data = {id: string, name: string, extra?: unknown};
type Rows = Data[];
type RenderRow = (data: Data) => React.ReactNode;

function List ({ rows, renderRow }: { rows: Rows, renderRow?: RenderRow }) {
  const location = useLocation();
  return (
    <ul className="grid gap-2 py-2">
      {rows.map((data) => {
        return (
          <li className="bg-slate-300 rounded-md hover:brightness-95" key={data.id}>
            <Link
              className="flex items-center justify-between p-2"
              to={data.id + location.search}
            >
              {typeof renderRow === "function" ? renderRow(data) : data.name}
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

function SearchButton ({className, filtersCount}: {className: string, filtersCount?: number}) {
  const [searchParams] = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());
  return (
    <Link
      className={clsx(className, filtersCount && 'flex items-center gap-[2px]' /*  border-slate-300 border-2 rounded-full px-2 p-1' */)}
      to={`?${new URLSearchParams({ ...searchParamsObj, open: "search" })}`}
    >
      <MagnifyingGlassIcon/>
      {filtersCount && filtersCount > 0
        ? <span className="text-[10px] rounded-full w-4 h-4 bg-slate-400 text-white flex items-center justify-center">{filtersCount}</span>
        : null}
    </Link>
  )
}

function CloseSearchButton () {
  const location = useLocation();
  return (
    <Link to={location.pathname}>
      <ArrowLeftIcon/>
    </Link>
  )
}

interface IndexProps {
  title: string,
  children: React.ReactNode,
  rows: Rows;
  searchFields?: React.ReactNode;
  renderRow?: RenderRow;
  searchFiltersCount?: number,
}

export default function Index ({ title, children, rows, searchFields, searchFiltersCount, renderRow }: IndexProps) {
  const location = useLocation();
  const path = useResolvedPath('.');
  const isIndex = location.pathname === path.pathname;
  const isMenuOpen = new URLSearchParams(location.search).get('open') === "menu";
  const isSearchOpen = new URLSearchParams(location.search).get('open') === "search";
  const hasSearch = !!searchFields;
  return (
    <div className="lg:grid lg:grid-flow-col lg:auto-cols-fr">
      <div
        className={clsx(
          "px-4 min-h-screen border-slate-300",
          "lg:border-r lg:overflow-y-auto lg:max-h-screen",
          (!isIndex || isMenuOpen) && "hidden lg:block",
        )}
      >
        {isSearchOpen ? (
          <>
            <header className="mb-2 border-b border-slate-300">
              <div className="flex items-center gap-4">
                <CloseSearchButton/>
                <h2>Pesquisa - {title}</h2>
              </div>
            </header>
            <Form method="GET" action={location.pathname}>
              {searchFields}
              <SubmitButton className="w-full">Buscar</SubmitButton>
            </Form>
          </>
        ) : (
          <>
            <header className="mb-2 border-b border-slate-300">
              <div className="flex items-center justify-between">
                <MenuButton/>
                <h2>{title}</h2>
                <SearchButton
                  // faz com invisible por causa do justify-between
                  className={clsx(!hasSearch && "invisible")}
                  filtersCount={searchFiltersCount}
                />
              </div>
            </header>
            <CreateLink/>
            <List rows={rows} renderRow={renderRow}/>
          </>
        )}
      </div>
      <div className={clsx(isMenuOpen && "lg:empty:hidden xl:empty:block")}>
        {children}
      </div>
    </div>
  )
}
