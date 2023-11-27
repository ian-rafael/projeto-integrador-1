import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { useEffect } from "react";
import { $Enums } from "@prisma/client";
import { SaleInstallmentPaymentForm } from "./app.vendas.$saleId.receive-installment.$installmentId";

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
      installments: sale.installments,
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
        AND: [{ status: $Enums.StatusParcela.PAGO }],
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
    <div>
      <div className="view-item">
        <b>Fornecedor: </b>
        <span>{sale.customerName}</span>
      </div>
      <div className="view-item">
        <b>Criado em: </b>
        <span>
          {new Date(sale.createdAt).toLocaleDateString("pt-BR")}
          {', '}
          {new Date(sale.createdAt).toLocaleTimeString("pt-BR")}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço unitário</th>
          </tr>
        </thead>
        <tbody>
          {sale.productItems.map((data) => {
            return (
              <tr key={data.productId}>
                <td>{data.productName}</td>
                <td>{data.quantity}</td>
                <td>{data.unitPrice}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>Parcela</th>
            <th>Data de vencimento</th>
            <th>Valor</th>
            <th>Pago</th>
            <th>Data de pagamento</th>
          </tr>
        </thead>
        <tbody>
          {sale.installments.map((data, i) => {
            return (
              <tr key={data.id}>
                <td>{i + 1}ª</td>
                <td>{new Date(data.dueDate).toLocaleDateString("pt-BR")}</td>
                <td>{data.value.toFixed(2)}</td>
                <td>{data.status === $Enums.StatusParcela.PAGO ? "✅" : "❌"}</td>
                <td>{data.paymentDate ? new Date(data.paymentDate).toLocaleDateString("pt-BR") : (
                  <SaleInstallmentPaymentForm installmentId={data.id} saleId={sale.id}/>
                )}</td>
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
