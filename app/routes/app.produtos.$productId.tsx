import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.productId, "params.productId is required");

  const product = await db.product.findUnique({
    select: { name: true, code: true, price: true, description: true, createdAt: true },
    where: { id: params.productId },
  });

  if (!product) {
    throw json("Product not found", { status: 404 });
  }

  return json({ product });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.productId, "params.productId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await db.product.delete({
      where: { id: params.productId },
    });
    return redirect("/app/produtos");
  }
  return badRequest({
    formError: "Intent precisa ser 'delete'",
  });
};

export default function UserView () {
  const { product } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="view-item">
        <b>Nome: </b>
        <span>{product.name}</span>
      </div>
      <div className="view-item">
        <b>Código: </b>
        <span>{product.code}</span>
      </div>
      <div className="view-item">
        <b>Preço: </b>
        <span>{product.price}</span>
      </div>
      <div className="view-item">
        <b>Descrição: </b>
        <span>{product.description}</span>
      </div>
      <div className="view-item">
        <b>Criado em: </b>
        <span>
          {new Date(product.createdAt).toLocaleDateString("pt-BR")}
          {', '}
          {new Date(product.createdAt).toLocaleTimeString("pt-BR")}
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
