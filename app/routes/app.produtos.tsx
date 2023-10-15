import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const products = await db.product.findMany({
    select: { id: true, name: true },
  });
  return json({ products });
};

export default function Users () {
  const { products } = useLoaderData<typeof loader>();
  return (
    <div className="index">
      <h2>Produtos</h2>
      <div className="list">
        <Link to="create">Novo produto</Link>
        <ul>
          {products.map((product) => {
            return (
              <li key={product.id}>
                <Link to={product.id}>{product.name}</Link>
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
