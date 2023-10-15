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
  const cpf = form.get("cpf");
  const email = form.get("email");
  const phone = form.get("phone");

  if (
    typeof name !== "string"
    || typeof cpf !== "string"
    || typeof email !== "string"
    || typeof phone !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { name, cpf, email, phone };
  const fieldErrors = {
    name: false ? "" : undefined,
    cpf: false ? "" : undefined,
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

  const customer = await db.customer.create({
    data: { name, cpf, email, phone },
  });

  return redirect("/app/clientes/" + customer.id);
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
        attr={['cpf']}
        errorMessage={actionData?.fieldErrors?.cpf}
        required={true}
        label="CPF"
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
