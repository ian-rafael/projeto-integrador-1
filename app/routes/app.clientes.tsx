import type { Prisma } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import Index from "~/components/Index";
import { CpfInput, Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { escapeFilterString } from "~/utils/helper";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const cpf = url.searchParams.get("cpf");
  const filters: Prisma.CustomerWhereInput = {};
  if (q) {
    filters.name = {
      contains: escapeFilterString(q),
      mode: "insensitive",
    };
  }
  if (cpf) {
    filters.cpf = cpf;
  }

  const customers = await db.customer.findMany({
    select: { id: true, name: true },
    where: filters,
    orderBy: { name: "asc" },
  });

  return json({ customers, searchFiltersCount: Object.keys(filters).length });
};

export default function Customers () {
  const { customers, searchFiltersCount } = useLoaderData<typeof loader>();
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
      <CpfInput
        attr={["cpf"]}
        defaultValue={searchParams.get('cpf') || undefined}
        label="CPF"
      />
    </>
  );

  return (
    <Index
      rows={customers}
      searchFields={searchFields}
      searchFiltersCount={searchFiltersCount}
      title="Clientes"
    >
      <Outlet/>
    </Index>
  );
}
