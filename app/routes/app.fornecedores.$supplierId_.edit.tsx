import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import Address, { type AddressType } from "~/components/Address";
import BackLink from "~/components/BackLink";
import { CnpjInput, Input, PhoneInput, SubmitButton, ValidationError } from "~/components/form";
import { Frame, FrameHeader } from "~/components/frame";
import Tag from "~/components/Tag";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateCEP, validateCNPJ, validateEmail, validatePhone } from "~/utils/validators";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.supplierId, "params.supplierId is required");

  const supplier = await db.supplier.findUnique({
    select: { id: true, name: true, email: true, cnpj: true, phone: true, address: true },
    where: { id: params.supplierId },
  });

  if (!supplier) {
    throw json("Supplier not found", { status: 404 });
  }

  return json({ supplier: { ...supplier, address: supplier.address as AddressType } });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.supplierId, "params.supplierId is required");

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
  const complement = form.get("complement");

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
    || typeof complement !== "string"
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
    complement: false ? "" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const address = { zipcode, state, city, street, number: number ? Number(number) : number, complement };
  const supplier = await db.supplier.update({
    where: { id: params.supplierId },
    data: { name, cnpj, email, phone, address },
  });

  return redirect("/app/fornecedores/" + supplier.id);
};

export default function SupplierEdit () {
  const { supplier } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Edição do fornecedor</h3>
      </FrameHeader>
      <Tag title="ID do fornecedor">{supplier.id}</Tag>
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
        <CnpjInput
          attr={['cnpj']}
          defaultValue={supplier.cnpj}
          errorMessage={actionData?.fieldErrors?.cnpj}
          label="CNPJ"
          required={true}
        />
        <PhoneInput
          attr={['phone']}
          defaultValue={supplier.phone}
          errorMessage={actionData?.fieldErrors?.phone}
          label="Telefone"
          required={true}
        />
        <Address
          defaultValues={supplier.address}
          errorMessages={{
            zipcode: actionData?.fieldErrors?.zipcode,
            state: actionData?.fieldErrors?.state,
            city: actionData?.fieldErrors?.city,
            street: actionData?.fieldErrors?.street,
            number: actionData?.fieldErrors?.number,
          }}
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
