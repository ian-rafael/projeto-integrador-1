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
  const todayPlusOneWeek = DateTime.now().startOf("day").plus({ week: 1 }).toJSDate();
  const firstDayOfMonth = DateTime.now().startOf("month").toJSDate();
  const lastDayOfMonth = DateTime.now().endOf("month").toJSDate();

  // VENDA
  const lateInstallmentsPromise = db.saleInstallment.findMany({
    select: {
      id: true,
      value: true,
      saleId: true,
      dueDate: true,
      sale: { select: { customer: { select: { name: true } } } },
    },
    where: { status: $Enums.StatusParcela.PENDENTE, dueDate: { lt: today } },
    orderBy: { dueDate: 'asc' },
  });

  const nextInstallmentsPromise = db.saleInstallment.findMany({
    select: {
      id: true,
      value: true,
      saleId: true,
      dueDate: true,
      sale: { select: { customer: { select: { name: true } } } },
    },
    where: { status: $Enums.StatusParcela.PENDENTE, dueDate: { gte: today, lt: todayPlusOneWeek } },
    orderBy: { dueDate: 'asc' },
  });

  const inflowPromise = db.saleInstallment.aggregate({
    _sum: { value: true },
    where: { paymentDate: { lte: lastDayOfMonth, gte: firstDayOfMonth } },
  });

  // COMPRA
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

  // EMPRESTIMO
  const lentProductsPromise = db.productLoan.findMany({
    select: { quantity: true, unitPrice: true },
    where: { loan: { createdAt: { lte: lastDayOfMonth, gte: firstDayOfMonth } } },
  });

  const lateReturnsPromise = db.loan.findMany({
    select: { id: true, dueDate: true, customer: { select: { name: true } } },
    where: {
      sale: null,
      dueDate: { lt: today },
      productItems: { some: { returnedQuantity: { lt: db.productLoan.fields.quantity } } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const nextReturnsPromise = db.loan.findMany({
    select: { id: true, dueDate: true, customer: { select: { name: true } } },
    where: {
      sale: null,
      dueDate: { gte: today, lt: todayPlusOneWeek },
      productItems: { some: { returnedQuantity: { lt: db.productLoan.fields.quantity } } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const [
    lateInstallments,
    nextInstallments,
    inflow,
    toBeReceivedProducts,
    boughtProducts,
    lentProducts,
    lateReturns,
    nextReturns,
  ] = await Promise.all([
    lateInstallmentsPromise,
    nextInstallmentsPromise,
    inflowPromise,
    toBeReceivedProductsPromise,
    boughtProductsPromise,
    lentProductsPromise,
    lateReturnsPromise,
    nextReturnsPromise,
  ]);

  return json({
    inflow: inflow._sum.value || 0,
    lateInstallments,
    nextInstallments,
    toBeReceivedProducts,
    outflow: boughtProducts.reduce((acc, data) => acc + data.quantity * data.unitPrice, 0),
    loanInflow: lentProducts.reduce((acc, data) => acc + data.quantity * data.unitPrice, 0),
    lateReturns,
    nextReturns,
  });
};

export default function App () {
  const {
    lateInstallments,
    nextInstallments,
    inflow,
    toBeReceivedProducts,
    outflow,
    loanInflow,
    lateReturns,
    nextReturns,
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
        <div>
          <h3 className="bg-slate-500 text-slate-50 px-2 py-1">Empréstimo</h3>
          <p>
            Recebido no mês:
            {' '}
            <span className="text-green-600">
              {loanInflow && formatCurrency(loanInflow)}
            </span>
          </p>
          <h4>Retornos atrasados:</h4>
          <ul>
            {lateReturns.map((data) => (
              <li key={data.id}>
                <Link
                  className="text-blue-600 underline"
                  to={`emprestimos/${data.id}`}
                >
                  {formatDate(data.dueDate)}
                  {' - '}
                  {data.customer.name}
                </Link>
              </li>
            ))}
          </ul>
          <h4>Próximos retornos:</h4>
          <ul>
            {nextReturns.map((data) => (
              <li key={data.id}>
                <Link
                  className="text-blue-600 underline"
                  to={`emprestimos/${data.id}`}
                >
                  {formatDate(data.dueDate)}
                  {' - '}
                  {data.customer.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  );
}
