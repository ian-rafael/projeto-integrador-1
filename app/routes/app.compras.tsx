import type { Prisma } from "@prisma/client";
import { CheckIcon, ClockIcon } from "@radix-ui/react-icons";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import Index from "~/components/Index";
import { ComboBox, Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { formatDate } from "~/utils/formatters";
import { requireUserId } from "~/utils/session.server";

enum Status {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const supplierId = url.searchParams.get("supplier[id]");
  const status = url.searchParams.get("status");

  const filters: Prisma.PurchaseWhereInput = {};
  if (status) {
    switch (status) {
      case Status.DELIVERED:
        filters.productItems = {
          every: { receivedQuantity: { equals: db.productPurchase.fields.quantity } },
        };
        break;
      case Status.PENDING:
        filters.productItems = {
          some: { receivedQuantity: { lt: db.productPurchase.fields.quantity } },
        };
        break;
    }
  }

  if (supplierId) {
    filters.supplierId = supplierId;
  }

  const purchases = await db.purchase.findMany({
    select: {
      id: true,
      createdAt: true,
      supplier: { select: { name: true } },
      productItems: {
        select: { productId: true },
        where: { receivedQuantity: { lt: db.productPurchase.fields.quantity } },
      },
    },
    where: filters,
    orderBy: { createdAt: "desc" },
  });

  return json({
    purchases: purchases.map(({id, createdAt, supplier, productItems}) => ({
      id,
      name: formatDate(createdAt) + " - " + supplier.name,
      extra: { pendingDeliveryCount: productItems.length },
    })),
    searchFiltersCount: Object.keys(filters).length
  });
};

export default function Purchases () {
  const { purchases, searchFiltersCount } = useLoaderData<typeof loader>();

  function renderRow ({name, extra}: {name: string, extra?: unknown}) {
    const { pendingDeliveryCount } = extra as typeof purchases[number]["extra"];
    return (
      <>
        {name}
        {pendingDeliveryCount > 0 ? (
          <span
            className="text-yellow-600 flex items-center gap-1 pr-1 text-sm"
            title={`${pendingDeliveryCount} produtos pendentes`}
          >
            {pendingDeliveryCount}
            <ClockIcon/>
          </span>
        ) : (
          <span
            className="text-green-600 flex items-center gap-px"
            title="Todas as parcelas pagas"
          >
            <CheckIcon/>
          </span>
        )}
      </>
    );
  }

  const [searchParams] = useSearchParams();
  const searchFields = (
    <>
      <ComboBox
        attr={['supplier']}
        defaultValue={
          searchParams.get('supplier[id]')
          ? {
            id: searchParams.get('supplier[id]') as string,
            label: searchParams.get('supplier[label]') as string
          }
          : undefined
        }
        label="Fornecedor"
        url="/app/fornecedores-search"
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
            attr={['delivered']}
            value={Status.DELIVERED}
            defaultChecked={searchParams.get('status') === Status.DELIVERED}
            name="status"
            type="radio"
            label="Entregue"
          />
          <Input
            attr={['pending']}
            value={Status.PENDING}
            defaultChecked={searchParams.get('status') === Status.PENDING}
            name="status"
            type="radio"
            label="Pendente"
          />
        </div>
      </fieldset>
    </>
  );

  return (
    <Index
      renderRow={renderRow}
      rows={purchases}
      searchFields={searchFields}
      searchFiltersCount={searchFiltersCount}
      title="Compras"
    >
      <Outlet/>
    </Index>
  );
}
