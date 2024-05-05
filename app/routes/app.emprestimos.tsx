import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Index from "~/components/Index";
import { db } from "~/utils/db.server";
import { formatDate } from "~/utils/formatters";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const loans = await db.loan.findMany({
    select: {
      id: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    loans: loans.map(({ id, createdAt, customer }) => ({
      id,
      name: formatDate(createdAt) + " - " + customer.name,
    })),
  });
};

export default function Loans () {
  const { loans } = useLoaderData<typeof loader>();
  return (
    <Index rows={loans} title="Empréstimos">
      <Outlet />
    </Index>
  );
}
