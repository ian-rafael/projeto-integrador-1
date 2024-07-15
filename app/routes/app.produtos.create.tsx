import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import { Input, SubmitButton, Textarea, ValidationError } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateCurrency, validateRequired } from "~/utils/validators";
import BarcodeInput from "~/components/BarcodeInput";
import { validateUniqueProductCode } from "~/utils/db-validators.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

  const form = await request.formData();
  const name = form.get("name");
  const code = form.get("code");
  const price = form.get("price");
  const description = form.get("description");

  if (
    typeof name !== "string"
    || typeof code !== "string"
    || typeof price !== "string"
    || typeof description !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { name, code, price, description };
  const fieldErrors = {
    name: validateRequired(name, "Nome"),
    code: validateRequired(code, "Código") || (await validateUniqueProductCode(code)),
    price: validateRequired(price, "Preço") || validateCurrency(price, "Preço"),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const product = await db.product.create({
    data: { name, code, price: Number(price), description },
  });

  return redirect("/app/produtos/" + product.id);
};

export default function ProductCreate () {
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Novo produto</h3>
      </FrameHeader>
      <Form method="post">
        <Input
          attr={['name']}
          errorMessage={actionData?.fieldErrors?.name}
          required={true}
          label="Nome"
          type="text"
        />
        <BarcodeInput
          attr={['code']}
          errorMessage={actionData?.fieldErrors?.code}
          required={true}
          label="Código"
        />
        <Input
          attr={['price']}
          errorMessage={actionData?.fieldErrors?.price}
          required={true}
          label="Preço"
          type="number"
          step=".01"
          min={0}
        />
        <Textarea
          attr={['description']}
          label="Descrição"
          rows={4}
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
