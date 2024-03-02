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
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 1C2.44771 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H10.5C10.7761 14 11 13.7761 11 13.5C11 13.2239 10.7761 13 10.5 13H3V2L10.5 2C10.7761 2 11 1.77614 11 1.5C11 1.22386 10.7761 1 10.5 1H3ZM12.6036 4.89645C12.4083 4.70118 12.0917 4.70118 11.8964 4.89645C11.7012 5.09171 11.7012 5.40829 11.8964 5.60355L13.2929 7H6.5C6.22386 7 6 7.22386 6 7.5C6 7.77614 6.22386 8 6.5 8H13.2929L11.8964 9.39645C11.7012 9.59171 11.7012 9.90829 11.8964 10.1036C12.0917 10.2988 12.4083 10.2988 12.6036 10.1036L14.8536 7.85355C15.0488 7.65829 15.0488 7.34171 14.8536 7.14645L12.6036 4.89645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
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
