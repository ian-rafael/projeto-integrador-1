import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import Address, { type AddressType } from "~/components/address";
import { Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.customerId is required");

  const customer = await db.customer.findUnique({
    select: { name: true, email: true, cpf: true, phone: true, address: true },
    where: { id: params.customerId },
  });

  if (!customer) {
    throw json("Customer not found", { status: 404 });
  }

  return json({ customer: { ...customer, address: customer.address as AddressType } });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.customerId is required");

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
    zipcode: false ? "" : undefined,
    state: false ? "" : undefined,
    city: false ? "" : undefined,
    street: false ? "" : undefined,
    number: false ? "" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const address = { zipcode, state, city, street, number: number ? Number(number) : number };
  const customer = await db.customer.update({
    where: { id: params.customerId },
    data: { name, cpf, email, phone, address },
  });

  return redirect("/app/clientes/" + customer.id);
};

export default function CustomerEdit () {
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
      <Address
        defaultValues={customer.address}
        errorMessages={{
          zipcode: actionData?.fieldErrors?.zipcode,
          state: actionData?.fieldErrors?.state,
          city: actionData?.fieldErrors?.city,
          street: actionData?.fieldErrors?.street,
          number: actionData?.fieldErrors?.number,
        }}
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
