import { $Enums } from "@prisma/client";
import { CheckIcon, ClockIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Index from "~/components/Index";
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
      installments: {
        select: { dueDate: true },
        where: { status: $Enums.StatusParcela.PENDENTE },
      },
    },
    orderBy: {
      createdAt: "desc",
    }
  });
  return json({
    sales: purchases.map(({id, createdAt, customer, installments}) => ({
      id,
      name: formatDate(createdAt) + " - " + customer.name,
      extra: {
        pendingInstallmentsCount: installments.length,
        lateInstallmentsCount: installments.filter(({dueDate}) => dueDate.getTime() < Date.now()).length,
      },
    }),
  )});
};

export default function Sales () {
  const {sales} = useLoaderData<typeof loader>();

  function renderRow ({name, extra}: {name: string, extra?: unknown}) {
    const {
      pendingInstallmentsCount,
      lateInstallmentsCount,
    } = extra as { pendingInstallmentsCount: number, lateInstallmentsCount: number };
    return (
      <>
        {name}
        {
          pendingInstallmentsCount > 0 ? (
            <span className="flex gap-1">
              {lateInstallmentsCount ? (
                <span
                  className="text-red-600 flex items-center gap-1 pr-1 text-sm"
                  title={`${lateInstallmentsCount} parcelas atrasadas`}
                >
                  {lateInstallmentsCount}
                  <ExclamationTriangleIcon/>
                </span>
              ) : null}
              <span
                className="text-yellow-600 flex items-center gap-1 pr-1 text-sm"
                title={`${pendingInstallmentsCount} parcelas pendentes`}
              >
                {pendingInstallmentsCount - lateInstallmentsCount}
                <ClockIcon/>
              </span>
            </span>
          ) : (
            <span
              className="text-green-600 flex items-center gap-px"
              title="Todas as parcelas pagas"
            >
              <CheckIcon/>
            </span>
          )
        }
      </>
    );
  }

  return (
    <Index
      rows={sales}
      title="Vendas"
      renderRow={renderRow}
    >
      <Outlet/>
    </Index>
  );
}
