import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Input, Select } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const suppliers = await db.supplier.findMany({
    select: { id: true, name: true },
  });

  return json({
    supplierOptions: suppliers.map(({id, name}) => ({
      id,
      label: name,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const supplier = form.get("supplier");

  if (
    typeof supplier !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { supplier };
  const fieldErrors = {
    supplier: false ? "" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const purchase = await db.purchase.create({
    data: { supplierId: supplier },
  });

  return redirect("/app/compras/" + purchase.id);
};

export default function PurchaseCreate () {
  const {supplierOptions} = useLoaderData<typeof loader>();
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
      <div className="row">
        <div className="column">
          <Input
            attr={['product']}
            type="text"
            label="Cód. do produto"
            required={true}
          />
        </div>
        <div className="column">
          <Input
            attr={['quantity']}
            defaultValue={1}
            label="Quantidade"
            min={1}
            required={true}
            type="number"
          />
        </div>
        <div className="column">
          <Input
            attr={['unit_price']}
            label="Preço unitário"
            min={0}
            required={true}
            step=".01"
            type="number"
          />
        </div>
      </div>
      {actionData?.formError ? (
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <button type="submit">Criar</button>
    </Form>
  );
}
