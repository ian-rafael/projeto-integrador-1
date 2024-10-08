import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import { ComboBox, FormArray, Input, SubmitButton, ValidationError } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateCurrency, validateRequired } from "~/utils/validators";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const supplierId = form.get("supplier[id]");
  const products = form.getAll("product[id]");
  const quantities = form.getAll("quantity");
  const unitPrices = form.getAll("unitPrice");

  if (
    typeof supplierId !== "string"
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

  const fields = { supplier: supplierId };
  const fieldErrors = {
    supplier: validateRequired(supplierId, "Fornecedor"),
    products: products.map((value, i) => products.slice(0, i).includes(value) ? "Produto duplicado" : undefined),
    unitPrices: unitPrices.map((value) => validateCurrency(value as string, "Preço unitário")),
  };
  if (Object.values(fieldErrors).some((value) => typeof value === "string" ? Boolean(value) : value?.some(Boolean))) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const purchase = await db.purchase.create({
    data: {
      supplierId,
      productItems: {
        createMany: {
          data: products.map((productId, i) => ({
            productId: String(productId),
            quantity: parseInt(String(quantities[i])),
            unitPrice: Number(unitPrices[i]),
          })),
        },
      },
    },
  });

  return redirect("/app/compras/" + purchase.id);
};

export default function PurchaseCreate () {
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Nova compra</h3>
      </FrameHeader>
      <Form method="post">
        <ComboBox
          attr={['supplier']}
          errorMessage={actionData?.fieldErrors?.supplier}
          label="Fornecedor"
          required={true}
          url="/app/fornecedores-search"
        />
        <FormArray defaultLength={1}>
          {(i) => (
            <div className="grid grid-cols-3 gap-1">
              <ComboBox
                attr={['product']}
                errorMessage={actionData?.fieldErrors?.products[i]}
                label="Produto"
                required={true}
                url="/app/produtos-search"
              />
              <Input
                attr={['quantity']}
                defaultValue={1}
                label="Quantidade"
                min={1}
                required={true}
                type="number"
              />
              <Input
                attr={['unitPrice']}
                errorMessage={actionData?.fieldErrors?.unitPrices[i]}
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
