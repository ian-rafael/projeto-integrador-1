import { redirect, type LoaderArgs, type LinksFunction, json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { getUser } from "~/utils/session.server";

import stylesUrl from "~/styles/app.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }
  return json({ user });
};

export default function App () {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div id="app">
      <header>
        <h1>Projeto Integrador</h1>
        <nav>
          <ul>
            <li>
              <Link to = "usuarios">Usuários</Link>
            </li>
          </ul>
        </nav>
        <div className="user-info">
          <span>{user.name}</span>
          <form action="/logout" method="post">
            <button type="submit">Sair</button>
          </form>
        </div>
      </header>
      <main>
        <Outlet/>
      </main>
    </div>
  );
}
