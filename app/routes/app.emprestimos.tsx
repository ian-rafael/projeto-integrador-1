import { Prisma } from "@prisma/client";
import { CheckIcon, ClockIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import Index from "~/components/Index";
import { ComboBox, Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { formatDate } from "~/utils/formatters";
import { getStartOfDay } from "~/utils/helper";
import { requireUserId } from "~/utils/session.server";

enum Status {
  DONE = "DONE",
  PENDING = "PENDING",
  LATE = "LATE",
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const customerId = url.searchParams.get("customer[id]");

  const filters: Prisma.LoanWhereInput = {};
  const searchFilters: {[key: string]: string} = {};
  if (status) {
    switch (status) {
      case Status.DONE:
        filters.OR = [
          { sale: { loanId: { not: null } } },
          { productItems: { every: { returnedQuantity: { equals: db.productLoan.fields.quantity } } } },
        ];
        break;
      case Status.LATE:
        filters.sale = null;
        filters.dueDate = { lt: getStartOfDay(Date.now()) };
        filters.productItems = { some: { returnedQuantity: { lt: db.productLoan.fields.quantity } } };
        break;
      case Status.PENDING:
        filters.sale = null;
        filters.productItems = { some: { returnedQuantity: { lt: db.productLoan.fields.quantity } } };
        break;
    }
    searchFilters.status = status;
  }
  if (customerId) {
    filters.customerId = customerId;
    searchFilters['customer[id]'] = customerId;
  }

  const loans = await db.loan.findMany({
    select: {
      id: true,
      createdAt: true,
      customer: { select: { name: true } },
      dueDate: true,
      _count: {
        select: {
          productItems: {
            where: { returnedQuantity: { lt: db.productLoan.fields.quantity } },
          },
        },
      },
      sale: { select: { id: true } },
    },
    where: filters,
    orderBy: { createdAt: "desc" },
  });

  return json({
    loans: loans.map((data) => ({
      id: data.id,
      name: formatDate(data.createdAt) + " - " + data.customer.name,
      extra: {
        status: data.sale || data._count.productItems === 0
          ? Status.DONE
          : getStartOfDay(Date.now()) <= getStartOfDay(data.dueDate)
          ? Status.PENDING
          : Status.LATE
      },
    })),
    searchFiltersCount: Object.keys(searchFilters).length,
  });
};

export default function Loans () {
  const { loans, searchFiltersCount } = useLoaderData<typeof loader>();

  function renderRow ({name, extra}: {name: string, extra?: unknown}) {
    const { status } = extra as typeof loans[number]["extra"];
    return (
      <>
        {name}
        {status === Status.LATE ? (
          <span
            className="text-red-600 flex items-center gap-1 text-sm"
            title="Atrasado"
          >
            <ExclamationTriangleIcon/>
          </span>
        ) : null}
        {status === Status.PENDING ? (
          <span
            className="text-yellow-600 flex items-center gap-1 text-sm"
            title="Pendente"
          >
            <ClockIcon/>
          </span>
        ) : null}
        {status === Status.DONE ? (
          <span
            className="text-green-600 flex items-center gap-px"
            title="Concluído"
          >
            <CheckIcon/>
          </span>
        ) : null}
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
            attr={['done']}
            value={Status.DONE}
            defaultChecked={searchParams.get('status') === Status.DONE}
            name="status"
            type="radio"
            label="Concluído"
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
  );

  return (
    <Index
      searchFields={searchFields}
      searchFiltersCount={searchFiltersCount}
      renderRow={renderRow}
      rows={loans}
      title="Empréstimos"
    >
      <Outlet />
    </Index>
  );
}
