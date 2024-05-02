import { $Enums, type Prisma } from "@prisma/client";
import { CheckIcon, ClockIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import Index from "~/components/Index";
import { ComboBox, Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { formatDate } from "~/utils/formatters";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const customerId = url.searchParams.get("customer[id]");

  const filters: Prisma.SaleWhereInput = {};
  if (status) {
    switch (status) {
      case Status.PAID:
        filters.installments = {
          every: { status: $Enums.StatusParcela.PAGO },
        };
        break;
      case Status.LATE:
        filters.installments = {
          some: {
            status: $Enums.StatusParcela.PENDENTE,
            dueDate: { lt: new Date() },
          },
        };
        break;
      case Status.PENDING:
        filters.installments = {
          some: { status: $Enums.StatusParcela.PENDENTE },
        };
        break;
    }
  }

  if (customerId) {
    filters.customerId = customerId;
  }

  const sales = await db.sale.findMany({
    select: {
      id: true,
      createdAt: true,
      customer: { select: { name: true } },
      installments: {
        select: { dueDate: true },
        where: { status: $Enums.StatusParcela.PENDENTE },
      },
    },
    where: filters,
    orderBy: { createdAt: "desc" },
  });

  return json({
    sales: sales.map(({id, createdAt, customer, installments}) => ({
      id,
      name: formatDate(createdAt) + " - " + customer.name,
      extra: {
        pendingInstallmentsCount: installments.length,
        lateInstallmentsCount: installments.filter(({dueDate}) => dueDate.getTime() < Date.now()).length,
      },
    })),
    searchFiltersCount: Object.keys(filters).length,
  });
};

enum Status {
  PAID = "PAID",
  PENDING = "PENDING",
  LATE = "LATE",
}

export default function Sales () {
  const { sales, searchFiltersCount } = useLoaderData<typeof loader>();

  function renderRow ({name, extra}: {name: string, extra?: unknown}) {
    const {
      pendingInstallmentsCount,
      lateInstallmentsCount,
    } = extra as typeof sales[number]["extra"];
    const pendingWithoutLateInstallmentsCount = pendingInstallmentsCount - lateInstallmentsCount;
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
              {pendingWithoutLateInstallmentsCount ? (
                <span
                  className="text-yellow-600 flex items-center gap-1 pr-1 text-sm"
                  title={`${pendingInstallmentsCount} parcelas pendentes`}
                >
                  {pendingWithoutLateInstallmentsCount}
                  <ClockIcon/>
                </span>
              ) : null}
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

  const [searchParams] = useSearchParams();
  const searchFields = (
    <>
      <ComboBox
        attr={['customer']}
        defaultValue={
          searchParams.get('customer[id]')
          ? {
            id: searchParams.get('customer[id]') as string,
            label: searchParams.get('customer[label]') as string
          }
          : undefined
        }
        label="Cliente"
        url="/app/clientes-search"
      />
      <fieldset>
        <legend>Status</legend>
        <div className="flex gap-4">
          <Input
            attr={['none']}
            value={undefined}
            defaultChecked={!searchParams.get('status')}
            name="status"
            type="radio"
            label="Todos"
          />
          <Input
            attr={['paid']}
            value={Status.PAID}
            defaultChecked={searchParams.get('status') === Status.PAID}
            name="status"
            type="radio"
            label="Pago"
          />
          <Input
            attr={['pending']}
            value={Status.PENDING}
            defaultChecked={searchParams.get('status') === Status.PENDING}
            name="status"
            type="radio"
            label="Pendente"
          />
          <Input
            attr={['late']}
            value={Status.LATE}
            defaultChecked={searchParams.get('status') === Status.LATE}
            name="status"
            type="radio"
            label="Atrasado"
          />
        </div>
      </fieldset>
    </>
  )

  return (
    <Index
      rows={sales}
      title="Vendas"
      renderRow={renderRow}
      searchFields={searchFields}
      searchFiltersCount={searchFiltersCount}
    >
      <Outlet/>
    </Index>
  );
}
