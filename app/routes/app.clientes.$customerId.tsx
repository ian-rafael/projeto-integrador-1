import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { AddressType } from "~/components/address";
import Tag from "~/components/tag";
import { Actions, Item, List } from "~/components/view";
import { db } from "~/utils/db.server";
import { formatDateHour } from "~/utils/formatters";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.customerId is required");

  const customer = await db.customer.findUnique({
    select: { id: true, name: true, email: true, cpf: true, phone: true, createdAt: true, address: true },
    where: { id: params.customerId },
  });

  if (!customer) {
    throw json("Customer not found", { status: 404 });
  }

  return json({ customer: {...customer, address: customer.address as AddressType } });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.customerId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await db.customer.delete({
      where: { id: params.customerId },
    });
    return redirect("/app/clientes");
  }
  return badRequest({
    formError: "Intent precisa ser 'delete'",
  });
};

export default function CustomerView () {
  const { customer } = useLoaderData<typeof loader>();
  return (
    <div>
      <Tag title="ID do cliente">{customer.id}</Tag>
      <h3>Cliente</h3>
      <List>
        <Item title="Nome">
          {customer.name}
        </Item>
        <Item title="Email">
          {customer.email}
        </Item>
        <Item title="CPF">
          {customer.cpf}
        </Item>
        <Item title="Telefone">
          {customer.phone}
        </Item>
        <Item title="Endereço">
          <p>{customer.address.street}, {customer.address.number}</p>
          <p>{customer.address.city} - {customer.address.state}</p>
          <p>{customer.address.zipcode}</p>
        </Item>
        <Item title="Criado em">
          {formatDateHour(customer.createdAt)}
        </Item>
      </List>
      <Actions/>
    </div>
  );
}
