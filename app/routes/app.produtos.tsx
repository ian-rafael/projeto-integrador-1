import type { Prisma } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import Index from "~/components/Index";
import { Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { escapeFilterString } from "~/utils/helper";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const stock = url.searchParams.get("stock");

  const filters: Prisma.ProductWhereInput = {};
  if (q) {
    filters.name = {
      contains: escapeFilterString(q),
      mode: "insensitive",
    };
  }
  if (stock && Number.isInteger(Number(stock))) {
    filters.stock = { lte: Number(stock) };
  }

  const products = await db.product.findMany({
    select: { id: true, name: true },
    where: filters,
    orderBy: { updatedAt: "desc" },
  });

  return json({ products, searchFiltersCount: Object.keys(filters).length });
};

export default function Products () {
  const { products, searchFiltersCount } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const searchFields = (
    <>
      <Input
        attr={["q"]}
        label=""
        defaultValue={searchParams.get('q') || undefined}
        placeholder="Nome"
        type="text"
      />
      <Input
        attr={["stock"]}
        label="Estoque menor ou igual a"
        defaultValue={searchParams.get('stock') || undefined}
        placeholder="Estoque menor ou igual a"
        type="number"
      />
    </>
  );

  return (
    <Index
      rows={products}
      searchFields={searchFields}
      searchFiltersCount={searchFiltersCount}
      title="Produtos"
    >
      <Outlet />
    </Index>
  );
}
