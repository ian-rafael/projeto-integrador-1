import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const customers = await db.customer.findMany({
    select: { id: true, name: true },
  });
  return json({ customers });
};

export default function Users () {
  const { customers } = useLoaderData<typeof loader>();
  return (
    <div className="index">
      <h2>Clientes</h2>
      <div className="list">
        <Link to="create">Novo cliente</Link>
        <ul>
          {customers.map((customer) => {
            return (
              <li key={customer.id}>
                <Link to={customer.id}>{customer.name}</Link>
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
