import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { AddressType } from "~/components/address";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.supplierId, "params.supplier is required");

  const supplier = await db.supplier.findUnique({
    select: { name: true, email: true, cnpj: true, phone: true, createdAt: true, address: true },
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

export default function UserView () {
  const { supplier } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="view-item">
        <b>Nome: </b>
        <span>{supplier.name}</span>
      </div>
      <div className="view-item">
        <b>Email: </b>
        <span>{supplier.email}</span>
      </div>
      <div className="view-item">
        <b>CNPJ: </b>
        <span>{supplier.cnpj}</span>
      </div>
      <div className="view-item">
        <b>Telefone: </b>
        <span>{supplier.phone}</span>
      </div>
      <div className="view-item">
        <b>Endereço: </b>
        <p>{supplier.address.street}, {supplier.address.number}</p>
        <p>{supplier.address.city} - {supplier.address.state}</p>
        <p>{supplier.address.zipcode}</p>
      </div>
      <div className="view-item">
        <b>Criado em: </b>
        <span>
          {new Date(supplier.createdAt).toLocaleDateString("pt-BR")}
          {', '}
          {new Date(supplier.createdAt).toLocaleTimeString("pt-BR")}
        </span>
      </div>
      <div className="view-actions">
        <Link to="edit">Editar</Link>
        <Form method="post" onSubmit={(event) => {
          if (
            !confirm(
              "Favor, confirme que você quer deletar esse registro."
            )
          ) {
            event.preventDefault();
          }
        }}>
          <button name="intent" value="delete" type="submit">
            Deletar
          </button>
        </Form>
      </div>
    </div>
  );
}
