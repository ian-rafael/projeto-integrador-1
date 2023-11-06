import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import Address from "~/components/address";
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
  const zipcode = form.get("zipcode");
  const state = form.get("state");
  const city = form.get("city");
  const street = form.get("street");
  const number = form.get("number");

  if (
    typeof name !== "string"
    || typeof cpf !== "string"
    || typeof email !== "string"
    || typeof phone !== "string"
    || typeof zipcode !== "string"
    || typeof state !== "string"
    || typeof city !== "string"
    || typeof street !== "string"
    || typeof number !== "string"
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

  const address = { zipcode, state, city, street, number: number ? Number(number) : number };
  const customer = await db.customer.create({
    data: { name, cpf, email, phone, address },
  });

  return redirect("/app/clientes/" + customer.id);
};

export default function CustomerCreate () {
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
      <Address/>
      {actionData?.formError ? (
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <button type="submit">Criar</button>
    </Form>
  );
}
