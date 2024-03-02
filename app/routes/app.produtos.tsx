import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Index from "~/components";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const products = await db.product.findMany({
    select: { id: true, name: true },
  });
  return json({ products });
};

export default function Products () {
  const { products } = useLoaderData<typeof loader>();
  return (
    <>
      <Index
        createLabel="Novo produto"
        rows={products}
        title="Produtos"
      />
      <Outlet/>
    </>
  );
}
