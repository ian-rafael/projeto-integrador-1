import { ExitIcon } from "@radix-ui/react-icons";
import { Form, Link, NavLink } from "@remix-run/react";
import clsx from "clsx/lite";

function NavListItem ({to, children}: {to: string, children: React.ReactNode}) {
  return (
    <li>
      <NavLink
        className={({isActive}) => clsx(
          "block p-4 relative",
          isActive && clsx(
            "bg-slate-200 rounded-s-full",
            "before:block before:w-4 before:h-4 before:absolute before:-top-4 before:right-0 before:rounded-br-2xl before:bg-slate-100 before:shadow-slate-200 before:shadow-[5px_5px_0_5px_var(--tw-shadow)]",
            "after:block after:w-4 after:h-4 after:absolute after:-bottom-4 after:right-0 after:rounded-tr-2xl after:bg-slate-100 after:shadow-slate-200 after:shadow-[5px_-5px_0_5px_var(--tw-shadow)]",
          )
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
    <nav className="my-8">
      <ul className="grid gap-6 ml-4">
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
  return (
    <header className="bg-slate-100 grid grid-rows-[auto_1fr_auto] max-w-60 py-4 sticky top-0 max-h-screen">
      <h1 className="px-4">
        <Link to="/app">Projeto Integrador</Link>
      </h1>
      <NavBar/>
      <div className="px-4 grid grid-cols-[1fr_auto] gap-px">
        <span
          className="leading-none p-3 bg-slate-200 rounded-s-full whitespace-nowrap overflow-hidden text-ellipsis"
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
    <div className="grid grid-cols-[auto_1fr] min-h-screen">
      <Header username={user.name}/>
      <main className="bg-slate-200 px-12 py-8 grid grid-cols-2">
        {children}
      </main>
    </div>
  );
}
