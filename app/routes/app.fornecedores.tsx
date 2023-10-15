import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const suppliers = await db.supplier.findMany({
    select: { id: true, name: true },
  });
  return json({ suppliers });
};

export default function Users () {
  const { suppliers } = useLoaderData<typeof loader>();
  return (
    <div className="index">
      <h2>Fornecedores</h2>
      <div className="list">
        <Link to="create">Novo fornecedor</Link>
        <ul>
          {suppliers.map((supplier) => {
            return (
              <li key={supplier.id}>
                <Link to={supplier.id}>{supplier.name}</Link>
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
