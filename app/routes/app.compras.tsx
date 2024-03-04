import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Index from "~/components/Index";
import { db } from "~/utils/db.server";
import { formatDate } from "~/utils/formatters";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const purchases = await db.purchase.findMany({
    select: {
      id: true,
      createdAt: true,
      supplier: { select: { name: true } },
    },
    orderBy: {
      createdAt: "desc",
    }
  });
  return json({
    purchases: purchases.map(({id, createdAt, supplier}) => ({
      id,
      name: formatDate(createdAt) + " - " + supplier.name,
    }),
  )});
};

export default function Purchases () {
  const {purchases} = useLoaderData<typeof loader>();
  return (
    <Index rows={purchases} title="Compras">
      <Outlet/>
    </Index>
  );
}
