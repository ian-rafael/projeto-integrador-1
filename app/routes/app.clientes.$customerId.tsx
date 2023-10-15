import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.userId is required");

  const customer = await db.customer.findUnique({
    select: { name: true, email: true, cpf: true, phone: true, createdAt: true },
    where: { id: params.customerId },
  });

  if (!customer) {
    throw json("Customer not found", { status: 404 });
  }

  return json({ customer });
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

export default function UserView () {
  const { customer } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="view-item">
        <b>Nome: </b>
        <span>{customer.name}</span>
      </div>
      <div className="view-item">
        <b>Email: </b>
        <span>{customer.email}</span>
      </div>
      <div className="view-item">
        <b>CPF: </b>
        <span>{customer.cpf}</span>
      </div>
      <div className="view-item">
        <b>Telefone: </b>
        <span>{customer.phone}</span>
      </div>
      <div className="view-item">
        <b>Criado em: </b>
        <span>
          {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
          {', '}
          {new Date(customer.createdAt).toLocaleTimeString("pt-BR")}
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
