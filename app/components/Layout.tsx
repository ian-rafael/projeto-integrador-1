import { ExitIcon } from "@radix-ui/react-icons";
import { Form, Link, NavLink, useLocation } from "@remix-run/react";
import clsx from "clsx/lite";

function NavListItem ({to, children}: {to: string, children: React.ReactNode}) {
  return (
    <li>
      <NavLink
        className={({isActive}) => clsx(
          "block p-4",
          isActive && clsx(
            "lg:bg-slate-200 lg:rounded-s-full lg:relative",
            "lg:before:block lg:before:w-4 lg:before:h-4 lg:before:absolute lg:before:-top-4 lg:before:right-0 lg:before:rounded-br-2xl lg:before:bg-slate-100 lg:before:shadow-slate-200 lg:before:shadow-[5px_5px_0_5px_var(--tw-shadow)]",
            "lg:after:block lg:after:w-4 lg:after:h-4 lg:after:absolute lg:after:-bottom-4 lg:after:right-0 lg:after:rounded-tr-2xl lg:after:bg-slate-100 lg:after:shadow-slate-200 lg:after:shadow-[5px_-5px_0_5px_var(--tw-shadow)]",
          ),
        )}
        to={to}
      >
        {children}
      </NavLink>
    </li>
  );
}

function NavBar () {
  return (
    <nav>
      <ul className="px-4 grid gap-4 lg:pr-0">
        <NavListItem to="produtos">Produtos</NavListItem>
        <NavListItem to="clientes">Clientes</NavListItem>
        <NavListItem to="vendas">Vendas</NavListItem>
        <NavListItem to="fornecedores">Fornecedores</NavListItem>
        <NavListItem to="compras">Compras</NavListItem>
        <NavListItem to="usuarios">Usuários</NavListItem>
      </ul>
    </nav>
  );
}

function LogoutButton () {
  return (
    <Form action="/logout" method="POST">
      <button type="submit" className="p-3 bg-gray-200 rounded-e-full" title="Sair do usuário">
        <ExitIcon/>
      </button>
    </Form>
  );
}

function Header ({username}: {username: string}) {
  const location = useLocation();
  const isOpen = new URLSearchParams(location.search).get('open') === "menu";
  return (
    <header
      className={clsx(
        "bg-slate-100 w-full min-h-screen lg:w-80 grid gap-10 grid-rows-[auto_1fr_auto] py-4",
        isOpen ? "absolute z-20 lg:relative" : "hidden xl:grid",
      )}
    >
      <h1 className="px-4">
        <Link to="/app">Projeto Integrador</Link>
      </h1>
      <NavBar/>
      <div className="px-4 grid grid-cols-[1fr_auto] gap-px">
        <span
          className="flex items-center px-3 bg-slate-200 rounded-s-full whitespace-nowrap overflow-hidden text-ellipsis"
          title={username}
        >
          {username}
        </span>
        <LogoutButton/>
      </div>
    </header>
  );
}

interface LayoutProps {
  children: React.ReactNode,
  user: {
    id: string,
    name: string,
  },
}

export default function Layout ({ children, user }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Header username={user.name}/>
      <main className="flex-1 bg-slate-200">
        {children}
      </main>
    </div>
  );
}
