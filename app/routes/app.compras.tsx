import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const purchases = await db.purchase.findMany({
    select: {
      id: true,
      createdAt: true,
      supplier: { select: { name: true } },
    },
  });
  return json({
    purchases: purchases.map(({id, createdAt, supplier}) => ({
      id,
      name: new Date(createdAt).toLocaleDateString("pt-BR") + " - " + supplier.name,
    }),
  )});
};

export default function Purchases () {
  const {purchases} = useLoaderData<typeof loader>();
  return (
    <div className="index">
      <h2>Compras</h2>
      <div className="list">
        <Link to="create">Nova compra</Link>
        <ul>
          {purchases.map((purchase) => {
            return (
              <li key={purchase.id}>
                <Link to={purchase.id}>{purchase.name}</Link>
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
