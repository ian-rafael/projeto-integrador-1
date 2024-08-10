import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import Address from "~/components/Address";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import { CpfInput, Input, PhoneInput, SubmitButton, ValidationError } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateCEP, validateCPF, validateEmail, validatePhone, validateRequired } from "~/utils/validators";
import { validateUniqueCPF } from "~/utils/db-validators.server";

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
    cpf: validateRequired(cpf, "CPF") || validateCPF(cpf) || (await validateUniqueCPF(cpf)),
    email: validateRequired(email, "E-mail") || validateEmail(email),
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
  const customer = await db.customer.create({
    data: { name, cpf, email, phone, address },
  });

  return redirect("/app/clientes/" + customer.id);
};

export default function CustomerCreate () {
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Novo cliente</h3>
      </FrameHeader>
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
          label="E-mail"
          type="email"
        />
        <CpfInput
          attr={['cpf']}
          errorMessage={actionData?.fieldErrors?.cpf}
          required={true}
          label="CPF"
        />
        <PhoneInput
          attr={['phone']}
          errorMessage={actionData?.fieldErrors?.phone}
          required={true}
          label="Telefone"
        />
        <Address
          errorMessages={{ zipcode: actionData?.fieldErrors?.zipcode }}
        />
        {actionData?.formError ? (
          <ValidationError>
            {actionData.formError}
          </ValidationError>
        ) : null}
        <SubmitButton>Criar</SubmitButton>
      </Form>
    </Frame>
  );
}
