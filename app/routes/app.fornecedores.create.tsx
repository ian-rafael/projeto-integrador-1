import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import Address from "~/components/address";
import { CnpjInput, Input, PhoneInput } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateCEP, validateCNPJ, validateEmail, validatePhone } from "~/utils/validators";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const name = form.get("name");
  const cnpj = form.get("cnpj");
  const email = form.get("email");
  const phone = form.get("phone");
  const zipcode = form.get("zipcode");
  const state = form.get("state");
  const city = form.get("city");
  const street = form.get("street");
  const number = form.get("number");

  if (
    typeof name !== "string"
    || typeof cnpj !== "string"
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

  const fields = { name, cnpj, email, phone };
  const fieldErrors = {
    name: name.length < 1 ? "Nome é obrigatório" : undefined,
    cnpj: validateCNPJ(cnpj),
    email: validateEmail(email),
    phone: validatePhone(phone),
    zipcode: zipcode.length < 1 ? undefined : validateCEP(zipcode),
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
  const supplier = await db.supplier.create({
    data: { name, cnpj, email, phone, address },
  });

  return redirect("/app/fornecedores/" + supplier.id);
};

export default function SupplierCreate () {
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
      <CnpjInput
        attr={['cnpj']}
        errorMessage={actionData?.fieldErrors?.cnpj}
        required={true}
        label="CNPJ"
      />
      <PhoneInput
        attr={['phone']}
        errorMessage={actionData?.fieldErrors?.phone}
        required={true}
        label="Telefone"
      />
      <Address
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
      <button type="submit">Criar</button>
    </Form>
  );
}
