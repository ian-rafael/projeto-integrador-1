import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { ProductItemDeleteButton } from "./app.compras.$purchaseId.delete-item.$productId";
import { ProductItemReceiveForm } from "./app.compras.$purchaseId.receive-item.$productId";
import { useEffect } from "react";
import { formatDateHour } from "~/utils/formatters";
import Tag from "~/components/Tag";
import { Actions, Item, List, Table } from "~/components/view";
import { Frame, FrameHeader } from "~/components/frame";
import BackLink from "~/components/BackLink";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");

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
      supplierName: purchase.supplier.name,
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
        receivedQuantity: { gte: 1 },
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
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Compra</h3>
      </FrameHeader>
      <Tag title="ID da compra">{purchase.id}</Tag>
      <List>
        <Item title="Fornecedor">
          {purchase.supplierName}
        </Item>
        <Item title="Criado em">
          {formatDateHour(purchase.createdAt)}
        </Item>
        <Item title="Produtos">
          <Table
            cols={[
              {
                label: 'Nome',
                property: 'productName',
                type: 'text',
              },
              {
                label: 'Qtd.',
                property: 'quantity',
                type: 'text',
              },
              {
                label: 'Recebido',
                property: 'receivedQuantity',
                type: 'text',
              },
              {
                label: 'Preço unit.',
                property: 'unitPrice',
                type: 'currency',
              },
              {
                label: 'Receber',
                property: 'receive',
                type: 'render',
                renderData: (data) => {
                  const maxQuantity = data.quantity - data.receivedQuantity;
                  if (maxQuantity <= 0) return null;
                  return (
                    <ProductItemReceiveForm
                      productId={data.productId}
                      purchaseId={purchase.id}
                      maxQuantity={maxQuantity}
                    />
                  );
                },
              },
              {
                label: 'Deletar',
                property: 'delete',
                type: 'render',
                renderData: (data) => {
                  const canDelete = data.receivedQuantity === 0;
                  if (!canDelete) return null;
                  return (
                    <ProductItemDeleteButton
                      productId={data.productId}
                      purchaseId={purchase.id}
                    />
                  );
                }
              },
            ]}
            rows={purchase.productItems}
            idKey="productId"
          />
        </Item>
      </List>
      <Actions/>
    </Frame>
  );
}
