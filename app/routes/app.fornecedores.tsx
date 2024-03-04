import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Index from "~/components/Index";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const suppliers = await db.supplier.findMany({
    select: { id: true, name: true },
  });
  return json({ suppliers });
};

export default function Suppliers () {
  const { suppliers } = useLoaderData<typeof loader>();
  return (
    <Index rows={suppliers} title="Fornecedores">
      <Outlet/>
    </Index>
  );
}
