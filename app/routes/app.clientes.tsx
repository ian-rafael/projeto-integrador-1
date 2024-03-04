import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Index from "~/components/Index";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const customers = await db.customer.findMany({
    select: { id: true, name: true },
  });
  return json({ customers });
};

export default function Customers () {
  const { customers } = useLoaderData<typeof loader>();
  return (
    <Index rows={customers} title="Clientes">
      <Outlet/>
    </Index>
  );
}
