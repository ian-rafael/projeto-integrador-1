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

  const filters: Prisma.SupplierWhereInput = {};
  if (q) {
    filters.name = {
      contains: escapeFilterString(q),
      mode: "insensitive",
    };
  }

  const suppliers = await db.supplier.findMany({
    select: { id: true, name: true },
    where: filters,
    orderBy: { name: "asc" },
  });

  return json({ suppliers, searchFiltersCount: Object.keys(filters).length });
};

export default function Suppliers () {
  const { suppliers, searchFiltersCount } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const searchFields = (
    <Input
      attr={["q"]}
      label=""
      defaultValue={searchParams.get('q') || undefined}
      placeholder="Nome"
      type="text"
    />
  );

  return (
    <Index
      rows={suppliers}
      searchFields={searchFields}
      searchFiltersCount={searchFiltersCount}
      title="Fornecedores"
    >
      <Outlet/>
    </Index>
  );
}
