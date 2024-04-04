import { $Enums } from "@prisma/client";
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";
import MenuButton from "~/components/MenuButton";
import { Frame, FrameHeader } from "~/components/frame";
import { db } from "~/utils/db.server";
import { formatCurrency, formatDate } from "~/utils/formatters";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const today = DateTime.now().startOf("day").toJSDate();
  const lateInstallmentsPromise = db.saleInstallment.findMany({
    select: {
      id: true,
      value: true,
      saleId: true,
      dueDate: true,
      sale: { select: { customer: { select: { name: true } } } },
    },
    where: { status: $Enums.StatusParcela.PENDENTE, dueDate: { lt: today } },
  });

  const todayPlusOneWeek = DateTime.now().startOf("day").plus({ week: 1 }).toJSDate();
  const nextInstallmentsPromise = db.saleInstallment.findMany({
    select: {
      id: true,
      value: true,
      saleId: true,
      dueDate: true,
      sale: { select: { customer: { select: { name: true } } } },
    },
    where: { status: $Enums.StatusParcela.PENDENTE, dueDate: { gte: today, lt: todayPlusOneWeek } },
  });

  const firstDayOfMonth = DateTime.now().startOf("month").toJSDate();
  const lastDayOfMonth = DateTime.now().endOf("month").toJSDate();
  const inflowPromise = db.saleInstallment.aggregate({
    _sum: { value: true },
    where: { paymentDate: { lte: lastDayOfMonth, gte: firstDayOfMonth } },
  });

  const toBeReceivedProductsPromise = db.productPurchase.findMany({
    select: {
      productId: true,
      purchaseId: true,
      quantity: true,
      receivedQuantity: true,
      product: { select: { name: true } },
      purchase: { select: { supplier: { select: { name: true } } } },
    },
    where: {
      receivedQuantity: { lt: db.productPurchase.fields.quantity },
    },
  });

  const boughtProductsPromise = db.productPurchase.findMany({
    select: { quantity: true, unitPrice: true },
    where: { purchase: { createdAt: { lte: lastDayOfMonth, gte: firstDayOfMonth } } },
  });

  const [
    lateInstallments,
    nextInstallments,
    inflow,
    toBeReceivedProducts,
    boughtProducts,
  ] = await Promise.all([
    lateInstallmentsPromise,
    nextInstallmentsPromise,
    inflowPromise,
    toBeReceivedProductsPromise,
    boughtProductsPromise,
  ]);

  return json({
    inflow: inflow._sum.value || 0,
    lateInstallments,
    nextInstallments,
    toBeReceivedProducts,
    outflow: boughtProducts.reduce((acc, data) => acc + data.quantity * data.unitPrice, 0),
  });
};

export default function App () {
  const {
    lateInstallments,
    nextInstallments,
    inflow,
    toBeReceivedProducts,
    outflow,
  } = useLoaderData<typeof loader>();

  return (
    <Frame>
      <FrameHeader>
        <MenuButton/>
        <h2>Dashboard</h2>
      </FrameHeader>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <h3 className="bg-slate-500 text-slate-50 px-2 py-1">Vendas</h3>
          <p>
            Recebido no mês:
            {' '}
            <span className="text-green-600">
              {inflow && formatCurrency(inflow)}
            </span>
          </p>
          <h4>Parcelas atrasadas:</h4>
          <ul>
            {lateInstallments.map((data) => (
              <li key={data.id}>
                <Link
                  className="text-blue-600 underline"
                  to={`vendas/${data.saleId}`}
                >
                  {formatDate(data.dueDate)}
                  {' - '}
                  {formatCurrency(data.value)}
                  {' - '}
                  {data.sale.customer.name}
                </Link>
              </li>
            ))}
          </ul>
          <h4>Próximas parcelas:</h4>
          <ul>
            {nextInstallments.map((data) => (
              <li key={data.id}>
                <Link
                  className="text-blue-600 underline"
                  to={`vendas/${data.saleId}`}
                >
                  {formatDate(data.dueDate)}
                  {' - '}
                  {formatCurrency(data.value)}
                  {' - '}
                  {data.sale.customer.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="bg-slate-500 text-slate-50 px-2 py-1">Compras</h3>
          <p>
            Gasto no mês:
            {' '}
            <span className="text-red-600">
              {outflow && formatCurrency(outflow)}
            </span>
          </p>
          <h4>A ser recebido:</h4>
          <ul>
            {toBeReceivedProducts.map((data) => (
              <li key={data.purchaseId + '-' + data.productId}>
                <Link
                  className="text-blue-600 underline"
                  to={`compras/${data.purchaseId}`}
                >
                  {data.product.name}
                  {` (${data.receivedQuantity}/${data.quantity})`}
                  {` - `}
                  {data.purchase.supplier.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  );
}
