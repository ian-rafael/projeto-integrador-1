import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const users = await db.user.findMany({
    select: { id: true, name: true },
  });
  return json({ users });
};

export default function Users () {
  const { users } = useLoaderData<typeof loader>();
  return (
    <div className="index">
      <h2>Usuários</h2>
      <div className="list">
        <Link to="create">Novo usuário</Link>
        <ul>
          {users.map((user) => {
            return (
              <li key={user.id}>
                <Link to={user.id}>{user.name}</Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="action">
        <Outlet/>
      </div>
    </div>
  );
}
