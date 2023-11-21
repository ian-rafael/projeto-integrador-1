import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { ProductItemDeleteButton } from "./app.compras.$purchaseId.delete-item.$productId";
import { ProductItemReceiveForm } from "./app.compras.$purchaseId.receive-item.$productId";
import { useEffect } from "react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.userId is required");

  const purchase = await db.purchase.findUnique({
    select: {
      createdAt: true,
      supplier: { select: { name: true } },
      id: true,
      productItems: {
        select: {
          product: { select: { name: true } },
          productId: true,
          quantity: true,
          receivedQuantity: true,
          unitPrice: true,
        }
      }
    },
    where: { id: params.purchaseId },
  });

  if (!purchase) {
    throw json("Purchase not found", { status: 404 });
  }

  return json({
    purchase: {
      id: purchase.id,
      createdAt: purchase.createdAt,
      supllierName: purchase.supplier.name,
      productItems: purchase.productItems.map((data) => ({
        productName: data.product.name,
        productId: data.productId,
        quantity: data.quantity,
        receivedQuantity: data.receivedQuantity,
        unitPrice: data.unitPrice,
      }))
    },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    const count = await db.productPurchase.count({
      where: {
        purchaseId: params.purchaseId,
        AND: [
          {
            receivedQuantity: {
              gte: 1,
            },
          },
        ],
      },
    });

    if (count > 0) {
      return badRequest({
        formError: "Erro ao deletar: Esse registro possui itens recebidos",
      });
    }

    await db.purchase.delete({
      where: { id: params.purchaseId },
    });
    return redirect("/app/compras");
  }
  return badRequest({
    formError: "Erro: Intent precisa ser 'delete'",
  });
};

export default function PurchaseView () {
  const actionData = useActionData<typeof action>();
  const {purchase} = useLoaderData<typeof loader>();

  useEffect(() => {
    if (actionData?.formError) {
      window.alert(actionData.formError);
    }
  }, [actionData]);

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
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Recebido</th>
            <th>Preço unitário</th>
            <th>Receber</th>
            <th>Deletar</th>
          </tr>
        </thead>
        <tbody>
          {purchase.productItems.map((data) => {
            const maxQuantity = data.quantity - data.receivedQuantity;
            const canDelete = data.receivedQuantity === 0;
            return (
              <tr key={data.productId}>
                <td>{data.productName}</td>
                <td>{data.quantity}</td>
                <td>{data.receivedQuantity}</td>
                <td>{data.unitPrice}</td>
                <td>
                  {maxQuantity > 0 ? (
                    <ProductItemReceiveForm
                      productId={data.productId}
                      purchaseId={purchase.id}
                      maxQuantity={maxQuantity}
                    />
                  ) : null}
                </td>
                <td>
                  {canDelete ? (
                    <ProductItemDeleteButton
                      productId={data.productId}
                      purchaseId={purchase.id}
                    />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
