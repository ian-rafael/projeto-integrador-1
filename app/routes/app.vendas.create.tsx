import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { DateTime } from "luxon";
import { ComboBox, FormArray, Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const customerId = form.get("customer[id]");
  const installmentQuantity = form.get("installment_quantity");
  const firstDueDate = form.get("due_date");
  const products = form.getAll("product[id]");
  const quantities = form.getAll("quantity");
  const unitPrices = form.getAll("unitPrice");

  if (
    typeof customerId !== "string"
    || typeof installmentQuantity !== "string"
    || typeof firstDueDate !== "string"
    || products.length === 0
    || quantities.length !== products.length
    || unitPrices.length !== products.length
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

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
    products: products.map((value, i) => products.slice(0, i).includes(value) ? "Produto duplicado" : undefined),
  };
  if (Object.values(fieldErrors).some((value) => typeof value === "string" ? Boolean(value) : value?.some(Boolean))) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  let total = 0;
  for (let i = 0; i < products.length; i++) {
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
          data: products.map((productId, i) => ({
            productId: String(productId),
            quantity: parseInt(String(quantities[i])),
            unitPrice: Number(unitPrices[i]),
          })),
        },
      },
      installments: {
        createMany: {
          data: installments,
        },
      },
    },
  });

  for (let i = 0; i < products.length; i++) {
    const decrement = Number(quantities[i]);
    const id = String(products[i]);
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
    <Form method="post">
      <ComboBox
        attr={['customer']}
        errorMessage={actionData?.fieldErrors?.customer}
        label="Cliente"
        required={true}
        url="/app/clientes-search"
      />
      <div className="row">
        <div className="col">
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
        <div className="col">
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
          <div className="row">
            <div className="col">
              <ComboBox
                attr={['product']}
                errorMessage={actionData?.fieldErrors?.products[i] || undefined}
                label="Produto"
                required={true}
                url="/app/produtos-search"
              />
            </div>
            <div className="col">
              <Input
                attr={['quantity']}
                defaultValue={1}
                label="Quantidade"
                min={1}
                required={true}
                type="number"
              />
            </div>
            <div className="col">
              <Input
                attr={['unitPrice']}
                label="Preço unitário"
                min={0}
                required={true}
                step=".01"
                type="number"
              />
            </div>
          </div>
        )}
      </FormArray>
      {actionData?.formError ? (
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <button type="submit">Criar</button>
    </Form>
  );
}
