import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import { ComboBox, FormArray, Input, SubmitButton, ValidationError } from "~/components/form";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import { DateTime } from "luxon";
import ProductItem from "~/components/ProductItem";
import { validateCurrency, validateDate, validateRequired } from "~/utils/validators";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const customerId = form.get("customer[id]");
  const dueDate = form.get("due_date");
  const productIds = form.getAll("product[id]");
  const quantities = form.getAll("quantity");
  const unitPrices = form.getAll("unitPrice");

  if (
    typeof customerId !== "string"
    || typeof dueDate !== "string"
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

  const fields = { customer: customerId, due_date: dueDate, products: productIds, quantity: quantities, unitPrice: unitPrices };
  const fieldErrors = {
    customer: validateRequired(customerId, "Cliente"),
    dueDate: validateDate(dueDate, "Data de devolução"),
    // slice para não aparecer o texto em dois inputs diferentes
    products: productIds.map((value, i) => productIds.slice(0, i).includes(value) ? "Produto duplicado" : undefined),
    quantities: productItems.map(({productId, quantity}) =>
      quantity > productsStockMap[productId]
      ? `Quantidade maior do que estoque (${productsStockMap[productId]})`
      : undefined
    ),
    unitPrices: unitPrices.map((value) => validateCurrency(value as string, "Preço unitário")),
  };
  if (Object.values(fieldErrors).some((value) => typeof value === "string" ? Boolean(value) : value?.some(Boolean))) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const loan = await db.loan.create({
    data: {
      customerId: customerId,
      dueDate: DateTime.fromISO(dueDate).toJSDate(),
      productItems: {
        createMany: {
          data: productItems,
        },
      },
    },
  });

  await Promise.all(productItems.map(async ({productId: id, quantity: decrement}) => {
    await db.product.update({
      data: { stock: { decrement } },
      where: { id },
    });
  }));

  return redirect("/app/emprestimos/" + loan.id);
};

export default function LoanCreate () {
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Novo empréstimo</h3>
      </FrameHeader>
      <Form method="post">
        <ComboBox
          attr={['customer']}
          errorMessage={actionData?.fieldErrors?.customer}
          label="Cliente"
          required={true}
          url="/app/clientes-search"
        />
        <Input
          attr={['due_date']}
          errorMessage={actionData?.fieldErrors?.dueDate}
          required={true}
          label="Data da devolução"
          type="date"
        />
        <FormArray defaultLength={1}>
          {(i) => (
            <ProductItem
              errorMessages={{
                product: actionData?.fieldErrors?.products[i],
                quantity: actionData?.fieldErrors?.quantities[i],
                unitPrice: actionData?.fieldErrors?.unitPrices[i],
              }}
            />
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
