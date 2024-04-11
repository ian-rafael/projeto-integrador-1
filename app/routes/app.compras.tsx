import type { Prisma } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import Index from "~/components/Index";
import { ComboBox } from "~/components/form";
import { db } from "~/utils/db.server";
import { formatDate } from "~/utils/formatters";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const supplierId = url.searchParams.get("supplier[id]");

  const filters: Prisma.PurchaseWhereInput = {};
  if (supplierId) {
    filters.supplierId = supplierId;
  }

  const purchases = await db.purchase.findMany({
    select: {
      id: true,
      createdAt: true,
      supplier: { select: { name: true } },
    },
    where: filters,
    orderBy: { createdAt: "desc" },
  });

  return json({
    purchases: purchases.map(({id, createdAt, supplier}) => ({
      id,
      name: formatDate(createdAt) + " - " + supplier.name,
    })),
    searchFiltersCount: Object.keys(filters).length
  });
};

export default function Purchases () {
  const { purchases, searchFiltersCount } = useLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();
  const searchFields = (
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
  );

  return (
    <Index
      rows={purchases}
      searchFields={searchFields}
      searchFiltersCount={searchFiltersCount}
      title="Compras"
    >
      <Outlet/>
    </Index>
  );
}
