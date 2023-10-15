import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.customerId is required");

  const customer = await db.customer.findUnique({
    select: { name: true, email: true, cpf: true, phone: true },
    where: { id: params.customerId },
  });

  if (!customer) {
    throw json("Customer not found", { status: 404 });
  }

  return json({ customer });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.customerId is required");

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

  const customer = await db.customer.update({
    where: { id: params.customerId },
    data: { name, cpf, email, phone },
  });

  return redirect("/app/clientes/" + customer.id);
};

export default function UserEdit () {
  const { customer } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <Input
        attr={['name']}
        errorMessage={actionData?.fieldErrors?.name}
        required={true}
        label="Nome"
        type="text"
        defaultValue={customer.name}
      />
      <Input
        attr={['email']}
        defaultValue={customer.email}
        errorMessage={actionData?.fieldErrors?.email}
        label="Email"
        required={true}
        type="email"
      />
      <Input
        attr={['cpf']}
        defaultValue={customer.cpf}
        errorMessage={actionData?.fieldErrors?.cpf}
        label="CPF"
        required={true}
        type="text"
      />
      <Input
        attr={['phone']}
        defaultValue={customer.phone}
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
