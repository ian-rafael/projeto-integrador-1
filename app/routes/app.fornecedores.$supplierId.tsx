import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { AddressType } from "~/components/address";
import Tag from "~/components/tag";
import { Actions, Item } from "~/components/view";
import { db } from "~/utils/db.server";
import { formatDateHour } from "~/utils/formatters";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.supplierId, "params.supplier is required");

  const supplier = await db.supplier.findUnique({
    select: { id: true, name: true, email: true, cnpj: true, phone: true, createdAt: true, address: true },
    where: { id: params.supplierId },
  });

  if (!supplier) {
    throw json("Supplier not found", { status: 404 });
  }

  return json({ supplier: {...supplier, address: supplier.address as AddressType } });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.supplierId, "params.supplierId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await db.supplier.delete({
      where: { id: params.supplierId },
    });
    return redirect("/app/fornecedores");
  }
  return badRequest({
    formError: "Intent precisa ser 'delete'",
  });
};

export default function SupplierView () {
  const { supplier } = useLoaderData<typeof loader>();
  return (
    <div>
      <Tag title="ID do fornecedor">{supplier.id}</Tag>
      <h3>Fornecedor</h3>
      <Item title="Nome">
        {supplier.name}
      </Item>
      <Item title="Email">
        {supplier.email}
      </Item>
      <Item title="CNPJ">
        {supplier.cnpj}
      </Item>
      <Item title="Telefone">
        {supplier.phone}
      </Item>
      <Item title="Endereço">
        <p>{supplier.address.street}, {supplier.address.number}</p>
        <p>{supplier.address.city} - {supplier.address.state}</p>
        <p>{supplier.address.zipcode}</p>
      </Item>
      <Item title="Criado em">
        {formatDateHour(supplier.createdAt)}
      </Item>
      <Actions/>
    </div>
  );
}
