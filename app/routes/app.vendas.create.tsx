import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import { ComboBox, FormArray, Input, SubmitButton, ValidationError } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

function validateInstallmentQuantity (installmentQuantity: string) {
  return !installmentQuantity
    ? "Quantidade inválida"
    : Number(installmentQuantity) < 1
    ? "O mínimo de parcelas é 1"
    : Number(installmentQuantity) > 12
    ? "O máximo de parcelas é 12"
    : undefined;
}

async function createSale ({
  productItems,
  installmentQuantity,
  firstDueDate,
  customerId,
  loanId,
}: {
  productItems: { productId: string, quantity: number, unitPrice: number }[],
  installmentQuantity: string,
  firstDueDate: string,
  customerId: string,
  loanId?: string,
}) {
  const total = productItems.reduce((acc, {quantity, unitPrice}) => acc + (unitPrice * quantity), 0);
  const installments = [];
  const value = total / Number(installmentQuantity);
  for (let i = 0; i < Number(installmentQuantity); i++) {
    const dueDate = DateTime.fromISO(firstDueDate).plus({ month: i }).toJSDate();
    installments.push({ dueDate, value });
  }

  return db.sale.create({
    data: {
      customerId,
      loanId,
      productItems: { createMany: { data: productItems } },
      installments: { createMany: { data: installments } },
    },
  });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const loanId = url.searchParams.get("loanId");

  const form = await request.formData();
  const customerId = form.get("customer[id]");
  const installmentQuantity = form.get("installment_quantity");
  const firstDueDate = form.get("due_date");
  const productIds = form.getAll("product[id]");
  const quantities = form.getAll("quantity");
  const unitPrices = form.getAll("unitPrice");

  if (loanId) {
    const loan = await db.loan.findUniqueOrThrow({
      select: {
        productItems: {
          where: { returnedQuantity: { lt: db.productLoan.fields.quantity } },
        },
        customerId: true,
        sale: { select: { id: true } },
      },
      where: { id: loanId }
    });
    if (loan.sale || (loan.productItems.length === 0)) {
      return redirect("/app/vendas");
    }

    if (
      typeof installmentQuantity !== "string"
      || typeof firstDueDate !== "string"
      || productIds.length === 0
      || unitPrices.length !== productIds.length
    ) {
      return badRequest({
        fields: null,
        fieldErrors: null,
        formError: "Form submitted incorrectly",
      });
    }

    const fields = { installment_quantity: installmentQuantity, due_date: firstDueDate };
    const fieldErrors = {
      customer: !loan.customerId ? "Cliente é obrigatório" : undefined,
      installmentQuantity: validateInstallmentQuantity(installmentQuantity),
      dueDate: isNaN(new Date(firstDueDate).getTime()) ? "Data inválida" : undefined,
      quantities: [],
      products: [],
    };
    if (Object.values(fieldErrors).some((value) => typeof value === "string" ? Boolean(value) : value?.some(Boolean))) {
      return badRequest({
        fields,
        fieldErrors,
        formError: null,
      });
    }

    const productUnitPricesMap = Object.fromEntries(productIds.map((id, i) => [id, unitPrices[i]]));
    const productItems = loan.productItems.map(({productId, quantity, returnedQuantity}) => ({
      productId,
      quantity: quantity - returnedQuantity,
      unitPrice: Number(productUnitPricesMap[productId]),
    }));
    const sale = await createSale({
      customerId: loan.customerId,
      productItems,
      firstDueDate,
      installmentQuantity,
      loanId,
    });

    return redirect("/app/vendas/" + sale.id);
  }

  if (
    typeof customerId !== "string"
    || typeof installmentQuantity !== "string"
    || typeof firstDueDate !== "string"
    || productIds.length === 0
    || quantities.length !== productIds.length
    || unitPrices.length !== productIds.length
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const productItems = productIds.map((productId, i) => ({
    productId: String(productId),
    quantity: parseInt(String(quantities[i])),
    unitPrice: Number(unitPrices[i]),
  }));
  const products = await db.product.findMany({
    select: { id: true, stock: true },
    where: { id: { in: productIds as string[] }},
  });
  const productsStockMap = Object.fromEntries(products.map(({id, stock}) => [id, stock]));

  const fields = { customer: customerId, installment_quantity: installmentQuantity, due_date: firstDueDate };
  const fieldErrors = {
    customer: !customerId ? "Cliente é obrigatório" : undefined,
    installmentQuantity: validateInstallmentQuantity(installmentQuantity),
    dueDate: isNaN(new Date(firstDueDate).getTime()) ? "Data inválida" : undefined,
    // slice para não aparecer o texto em dois inputs diferentes
    products: productIds.map((value, i) => productIds.slice(0, i).includes(value) ? "Produto duplicado" : undefined),
    quantities: productItems.map(({productId, quantity}) =>
      quantity > productsStockMap[productId]
      ? `Quantidade maior do que estoque (${productsStockMap[productId]})`
      : undefined
    ),
  };
  if (Object.values(fieldErrors).some((value) => typeof value === "string" ? Boolean(value) : value?.some(Boolean))) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  // Criação
  const sale = await createSale({
    customerId,
    firstDueDate,
    installmentQuantity,
    productItems,
  });
  await Promise.all(productItems.map(async ({productId: id, quantity: decrement}) => {
    await db.product.update({
      data: { stock: { decrement } },
      where: { id },
    });
  }));

  return redirect("/app/vendas/" + sale.id);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const loanId = url.searchParams.get("loanId");
  let loan = null;
  if (loanId) {
    const loanInfo = await db.loan.findUniqueOrThrow({
      select: {
        customer: { select: { name: true } },
        sale: { select: { id: true } },
        productItems: {
          select: {
            productId: true,
            quantity: true,
            returnedQuantity: true,
            product: { select: { name: true } },
          },
          where: { returnedQuantity: { lt: db.productLoan.fields.quantity } },
        },
      },
      where: { id: loanId },
    });
    if (loanInfo.sale || (loanInfo.productItems.length === 0)) {
      return redirect("/app/vendas");
    }
    loan = {
      customerName: loanInfo.customer.name,
      productItems: loanInfo.productItems.map((data) => ({
        productId: data.productId,
        productName: data.product.name,
        quantity: data.quantity - data.returnedQuantity,
      })),
    };
  }

  return json({ loan });
};

export default function SaleCreate () {
  const { loan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Nova venda</h3>
      </FrameHeader>
      <Form method="post">
        {loan ? (
          <div className="flex flex-col mb-2">
            <span>Cliente</span>
            <div className="p-2 flex-1 flex items-center">
              <b>{loan.customerName}</b>
            </div>
          </div>
        ) : (
          <ComboBox
            attr={['customer']}
            errorMessage={actionData?.fieldErrors?.customer}
            label="Cliente"
            required={true}
            url="/app/clientes-search"
          />
        )}
        <div className="grid grid-cols-2 gap-1 items-end">
          <div>
            <Input
              attr={['installment_quantity']}
              defaultValue={1}
              errorMessage={actionData?.fieldErrors?.installmentQuantity}
              label="Parcelas"
              max={12}
              min={1}
              required={true}
              type="number"
            />
          </div>
          <div>
            <Input
              attr={['due_date']}
              defaultValue={new Date().toISOString().split('T')[0]}
              errorMessage={actionData?.fieldErrors?.dueDate}
              required={true}
              label="Data do primeiro vencimento"
              type="date"
            />
          </div>
        </div>
        {loan ? (
          <div>
            {loan.productItems.map(({productId, productName, quantity}) => (
              <div className="grid grid-cols-3 gap-1" key={productId}>
                <div className="flex flex-col mb-2">
                  <span>Produto</span>
                  <div className="p-2 flex-1 flex items-center">
                    <b title={productName} className="truncate">{productName}</b>
                  </div>
                  <input type="hidden" name="product[id]" value={productId}/>
                </div>
                <div className="flex flex-col mb-2">
                  <span>Quantidade</span>
                  <div className="p-2 flex-1 flex items-center">x {quantity}</div>
                </div>
                <Input
                  attr={['unitPrice']}
                  label="Preço unitário"
                  min={0}
                  required={true}
                  step=".01"
                  type="number"
                />
              </div>
            ))}
          </div>
        ) : (
          <FormArray defaultLength={1}>
            {(i) => (
              <div className="grid grid-cols-3 gap-1">
                <ComboBox
                  attr={['product']}
                  errorMessage={actionData?.fieldErrors?.products[i] || undefined}
                  label="Produto"
                  required={true}
                  url="/app/produtos-search"
                />
                <Input
                  attr={['quantity']}
                  defaultValue={1}
                  label="Quantidade"
                  errorMessage={actionData?.fieldErrors?.quantities[i] || undefined}
                  min={1}
                  required={true}
                  type="number"
                />
                <Input
                  attr={['unitPrice']}
                  label="Preço unitário"
                  min={0}
                  required={true}
                  step=".01"
                  type="number"
                />
              </div>
            )}
          </FormArray>
        )}
        {actionData?.formError ? (
          <ValidationError>
            {actionData.formError}
          </ValidationError>
        ) : null}
        <SubmitButton>Criar</SubmitButton>
      </Form>
    </Frame>
  );
}
