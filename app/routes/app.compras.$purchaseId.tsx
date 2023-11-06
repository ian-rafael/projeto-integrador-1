import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.userId is required");

  const purchase = await db.purchase.findUnique({
    select: {
      createdAt: true,
      supplier: { select: { name: true } },
    },
    where: { id: params.purchaseId },
  });

  if (!purchase) {
    throw json("Purchase not found", { status: 404 });
  }

  return json({
    purchase: {
      createdAt: purchase.createdAt,
      supllierName: purchase.supplier.name,
    },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await db.purchase.delete({
      where: { id: params.purchaseId },
    });
    return redirect("/app/compras");
  }
  return badRequest({
    formError: "Intent precisa ser 'delete'",
  });
};

export default function PurchaseView () {
  const {purchase} = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="view-item">
        <b>Fornecedor: </b>
        <span>{purchase.supllierName}</span>
      </div>
      <div className="view-item">
        <b>Criado em: </b>
        <span>
          {new Date(purchase.createdAt).toLocaleDateString("pt-BR")}
          {', '}
          {new Date(purchase.createdAt).toLocaleTimeString("pt-BR")}
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
