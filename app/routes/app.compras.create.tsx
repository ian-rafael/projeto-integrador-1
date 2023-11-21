import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { FormArray, Input, Select } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const [suppliers, products] = await Promise.all([
    db.supplier.findMany({
      select: { id: true, name: true },
    }),
    db.product.findMany({
      select: { id: true, name: true },
    })
  ]);

  return json({
    supplierOptions: suppliers.map(({id, name}) => ({
      id,
      label: name,
    })),
    productOptions: products.map(({id, name}) => ({
      id,
      label: name,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const supplier = form.get("supplier");
  const products = form.getAll("product");
  const quantities = form.getAll("quantity");
  const unitPrices = form.getAll("unitPrice");

  if (
    typeof supplier !== "string"
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

  const fields = { supplier };
  const fieldErrors = {
    supplier: supplier.length < 1 ? "Fornecedor é obrigatório" : undefined,
    products: products.map((value, i) => products.slice(0, i).includes(value) ? "Produto duplicado" : undefined),
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
      supplierId: supplier,
      productItems: {
        createMany: {
          data: products.map((productId, i) => ({
            productId: String(productId),
            quantity: Number(quantities[i]),
            unitPrice: Number(unitPrices[i]),
          })),
        },
      },
    },
  });

  return redirect("/app/compras/" + purchase.id);
};

export default function PurchaseCreate () {
  const {supplierOptions, productOptions} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <Select
        attr={['supplier']}
        defaultValue={actionData?.fields?.supplier}
        errorMessage={actionData?.fieldErrors?.supplier}
        label="Fornecedor"
        options={supplierOptions}
        required={true}
      />
      <FormArray defaultLength={1}>
        {(i) => (
          <div className="row">
            <div className="col">
              <Select
                attr={['product']}
                label="Produto"
                errorMessage={actionData?.fieldErrors?.products[i] || undefined}
                options={productOptions}
                required={true}
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
