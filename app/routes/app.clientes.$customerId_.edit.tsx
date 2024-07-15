import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import Address, { type AddressType } from "~/components/Address";
import BackLink from "~/components/BackLink";
import { CpfInput, Input, PhoneInput, SubmitButton, ValidationError } from "~/components/form";
import { Frame, FrameHeader } from "~/components/frame";
import Tag from "~/components/Tag";
import { validateUniqueCPF } from "~/utils/db-validators.server";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateCEP, validateCPF, validateEmail, validatePhone, validateRequired } from "~/utils/validators";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.customerId, "params.customerId is required");

  const customer = await db.customer.findUnique({
    select: { id: true, name: true, email: true, cpf: true, phone: true, address: true },
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
  const zipcode = form.get("zipcode");
  const state = form.get("state");
  const city = form.get("city");
  const street = form.get("street");
  const number = form.get("number");
  const complement = form.get("complement");

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
    || typeof complement !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { name, cpf, email, phone };
  const fieldErrors = {
    name: validateRequired(name, "Nome"),
    cpf: validateRequired(cpf, "CPF") || validateCPF(cpf) || (await validateUniqueCPF(cpf, params.customerId)),
    email: validateRequired(email, "Email") || validateEmail(email),
    phone: validateRequired(phone, "Telefone") || validatePhone(phone),
    zipcode: zipcode.length > 0 ? validateCEP(zipcode) : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const address = { zipcode, state, city, street, number: number ? Number(number) : number, complement };
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
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Edição do cliente</h3>
      </FrameHeader>
      <Tag title="ID do cliente">{customer.id}</Tag>
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
        <CpfInput
          attr={['cpf']}
          defaultValue={customer.cpf}
          errorMessage={actionData?.fieldErrors?.cpf}
          required={true}
          label="CPF"
        />
        <PhoneInput
          attr={['phone']}
          defaultValue={customer.phone}
          errorMessage={actionData?.fieldErrors?.phone}
          label="Telefone"
          required={true}
        />
        <Address
          defaultValues={customer.address as AddressType}
          errorMessages={{ zipcode: actionData?.fieldErrors?.zipcode }}
        />
        {actionData?.formError ? (
          <ValidationError>
            {actionData.formError}
          </ValidationError>
        ) : null}
        <SubmitButton>Salvar</SubmitButton>
      </Form>
    </Frame>
  );
}
