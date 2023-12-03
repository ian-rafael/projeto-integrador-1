import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { formatDate } from "~/utils/formatters";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const purchases = await db.sale.findMany({
    select: {
      id: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
    orderBy: {
      createdAt: "desc",
    }
  });
  return json({
    sales: purchases.map(({id, createdAt, customer}) => ({
      id,
      name: formatDate(createdAt) + " - " + customer.name,
    }),
  )});
};

export default function Sales () {
  const {sales} = useLoaderData<typeof loader>();
  return (
    <div className="index">
      <h2>Vendas</h2>
      <div className="list">
        <Link to="create">Nova venda</Link>
        <ul>
          {sales.map((sale) => {
            return (
              <li key={sale.id}>
                <Link to={sale.id}>{sale.name}</Link>
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
