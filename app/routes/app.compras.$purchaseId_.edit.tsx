import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Select } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");

  const purchase = await db.purchase.findUnique({
    select: { supplierId: true },
    where: { id: params.purchaseId },
  });

  const suppliers = await db.supplier.findMany({
    select: { id: true, name: true },
  });

  if (!purchase) {
    throw json("Purchase not found", { status: 404 });
  }

  return json({
    purchase,
    supplierOptions: suppliers.map(({id, name}) => ({
      id,
      label: name,
    })),
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");

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
    supplier: supplier.length < 1 ? "Fornecedor é obrigatório" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const purchase = await db.purchase.update({
    where: { id: params.purchaseId },
    data: { supplierId: supplier },
  });

  return redirect("/app/compras/" + purchase.id);
};

export default function PurchaseEdit () {
  const { purchase, supplierOptions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <Select
        attr={['supplier']}
        defaultValue={purchase.supplierId}
        errorMessage={actionData?.fieldErrors?.supplier}
        label="Fornecedor"
        options={supplierOptions}
        required={true}
      />
      {actionData?.formError ? (
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <button type="submit">Salvar</button>
    </Form>
  );
}
