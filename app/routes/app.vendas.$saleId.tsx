import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { useEffect } from "react";
import { $Enums } from "@prisma/client";
import { SaleInstallmentPaymentForm } from "./app.vendas.$saleId.receive-installment.$installmentId";
import { formatDate, formatDateHour } from "~/utils/formatters";
import Tag from "~/components/Tag";
import { Actions, Item, List, Table } from "~/components/view";
import { Frame, FrameHeader } from "~/components/frame";
import BackLink from "~/components/BackLink";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.saleId, "params.saleId is required");

  const sale = await db.sale.findUnique({
    select: {
      createdAt: true,
      customer: { select: { name: true } },
      id: true,
      productItems: {
        select: {
          product: { select: { name: true } },
          productId: true,
          quantity: true,
          unitPrice: true,
        }
      },
      installments: {
        orderBy: { dueDate: "asc" },
      }
    },
    where: { id: params.saleId },
  });

  if (!sale) {
    throw json("Sale not found", { status: 404 });
  }

  return json({
    sale: {
      id: sale.id,
      createdAt: sale.createdAt,
      customerName: sale.customer.name,
      installments: sale.installments.map((data, index) => ({
        ...data,
        paid: data.status === $Enums.StatusParcela.PAGO,
        number: index + 1,
      })),
      productItems: sale.productItems.map((data) => ({
        productName: data.product.name,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
      })),
    },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.saleId, "params.saleId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    const count = await db.saleInstallment.count({
      where: {
        saleId: params.saleId,
        status: $Enums.StatusParcela.PAGO,
      },
    });

    if (count > 0) {
      return badRequest({
        formError: "Erro ao deletar: Esse registro possui parcelas pagas",
      });
    }

    const productItems = await db.productSale.findMany({
      where: { saleId: params.saleId },
    });

    for (let i = 0; i < productItems.length; i++) {
      const id = productItems[i].productId;
      const increment = productItems[i].quantity;
      await db.product.update({
        data: { stock: {increment} },
        where: { id },
      });
    }

    await db.sale.delete({
      where: { id: params.saleId },
    });
    return redirect("/app/vendas");
  }

  return badRequest({
    formError: "Erro: Intent precisa ser 'delete'",
  });
};

export default function SaleView () {
  const actionData = useActionData<typeof action>();
  const {sale} = useLoaderData<typeof loader>();

  useEffect(() => {
    if (actionData?.formError) {
      window.alert(actionData.formError);
    }
  }, [actionData]);

  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Venda</h3>
      </FrameHeader>
      <Tag title="ID da venda">{sale.id}</Tag>
      <List>
        <Item title="Cliente">
          {sale.customerName}
        </Item>
        <Item title="Criado em">
          {formatDateHour(sale.createdAt)}
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
                label: 'Preço unit.',
                property: 'unitPrice',
                type: 'currency',
              },
            ]}
            rows={sale.productItems}
            idKey="productId"
          />
        </Item>
        <Item title="Parcelas">
          <Table
            cols={[
              {label: 'Nº', property: 'number', type: 'text'},
              {label: 'Data de vencimento', property: 'dueDate', type: 'date'},
              {label: 'Valor', property: 'value', type: 'currency'},
              {label: 'Pago', property: 'paid', type: 'bool'},
              {
                label: 'Data de pagamento',
                property: 'paymentDate',
                type: 'render',
                renderData: (data) => {
                  if (data.paymentDate) return formatDate(data.paymentDate);
                  return (
                    <SaleInstallmentPaymentForm
                      installmentId={data.id}
                      saleId={sale.id}
                    />
                  );
                }
              },
            ]}
            rows={sale.installments}
          />
        </Item>
      </List>
      <Actions/>
    </Frame>
  );
}
