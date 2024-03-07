import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { DateTime } from "luxon";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import { ComboBox, FormArray, Input, SubmitButton, ValidationError } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const customerId = form.get("customer[id]");
  const installmentQuantity = form.get("installment_quantity");
  const firstDueDate = form.get("due_date");
  const productIds = form.getAll("product[id]");
  const quantities = form.getAll("quantity");
  const unitPrices = form.getAll("unitPrice");

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
    customer: customerId.length < 1 ? "Cliente é obrigatório" : undefined,
    installmentQuantity: !installmentQuantity
      ? "Quantidade inválida"
      : Number(installmentQuantity) < 1
      ? "O mínimo de parcelas é 1"
      : Number(installmentQuantity) > 12
      ? "O máximo de parcelas é 12"
      : undefined,
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

  let total = 0;
  for (let i = 0; i < productIds.length; i++) {
    total += Number(unitPrices[i]) * Number(quantities[i]);
  }

  const installments = [];
  const value = total / Number(installmentQuantity);
  for (let i = 0; i < Number(installmentQuantity); i++) {
    const dueDate = DateTime.fromISO(firstDueDate).plus({ month: i }).toJSDate();
    installments.push({ dueDate, value });
  }

  const sale = await db.sale.create({
    data: {
      customerId: customerId,
      productItems: {
        createMany: {
          data: productItems,
        },
      },
      installments: {
        createMany: {
          data: installments,
        },
      },
    },
  });

  for (let i = 0; i < productIds.length; i++) {
    const decrement = Number(quantities[i]);
    const id = String(productIds[i]);
    await db.product.update({
      data: { stock: { decrement } },
      where: { id },
    });
  }

  return redirect("/app/vendas/" + sale.id);
};

export default function SaleCreate () {
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Nova venda</h3>
      </FrameHeader>
      <Form method="post">
        <ComboBox
          attr={['customer']}
          errorMessage={actionData?.fieldErrors?.customer}
          label="Cliente"
          required={true}
          url="/app/clientes-search"
        />
        <div className="grid grid-cols-2 gap-1">
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
