import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

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

  const supplier = await db.supplier.create({
    data: { name, cnpj, email, phone },
  });

  return redirect("/app/fornecedores/" + supplier.id);
};

export default function UserCreate () {
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <Input
        attr={['name']}
        errorMessage={actionData?.fieldErrors?.name}
        required={true}
        label="Nome"
        type="text"
      />
      <Input
        attr={['email']}
        errorMessage={actionData?.fieldErrors?.email}
        required={true}
        label="Email"
        type="email"
      />
      <Input
        attr={['cnpj']}
        errorMessage={actionData?.fieldErrors?.cnpj}
        required={true}
        label="CNPJ"
        type="text"
      />
      <Input
        attr={['phone']}
        errorMessage={actionData?.fieldErrors?.phone}
        required={true}
        label="Telefone"
        type="text"
      />
      {actionData?.formError ? (
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <button type="submit">Criar</button>
    </Form>
  );
}
