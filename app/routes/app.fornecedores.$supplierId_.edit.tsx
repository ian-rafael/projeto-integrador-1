import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.supplierId, "params.supplierId is required");

  const supplier = await db.supplier.findUnique({
    select: { name: true, email: true, cnpj: true, phone: true },
    where: { id: params.supplierId },
  });

  if (!supplier) {
    throw json("Supplier not found", { status: 404 });
  }

  return json({ supplier });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.supplierId, "params.supplierId is required");

  const form = await request.formData();
  const name = form.get("name");
  const cnpj = form.get("cnpj");
  const email = form.get("email");
  const phone = form.get("phone");

  if (
    typeof name !== "string"
    || typeof cnpj !== "string"
    || typeof email !== "string"
    || typeof phone !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { name, cnpj, email, phone };
  const fieldErrors = {
    name: false ? "" : undefined,
    cnpj: false ? "" : undefined,
    email: false ? "" : undefined,
    phone: false ? "" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const supplier = await db.supplier.update({
    where: { id: params.supplierId },
    data: { name, cnpj, email, phone },
  });

  return redirect("/app/fornecedores/" + supplier.id);
};

export default function UserEdit () {
  const { supplier } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <Input
        attr={['name']}
        errorMessage={actionData?.fieldErrors?.name}
        required={true}
        label="Nome"
        type="text"
        defaultValue={supplier.name}
      />
      <Input
        attr={['email']}
        defaultValue={supplier.email}
        errorMessage={actionData?.fieldErrors?.email}
        label="Email"
        required={true}
        type="email"
      />
      <Input
        attr={['cnpj']}
        defaultValue={supplier.cnpj}
        errorMessage={actionData?.fieldErrors?.cnpj}
        label="cnpj"
        required={true}
        type="text"
      />
      <Input
        attr={['phone']}
        defaultValue={supplier.phone}
        errorMessage={actionData?.fieldErrors?.phone}
        label="Telefone"
        required={true}
        type="text"
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
