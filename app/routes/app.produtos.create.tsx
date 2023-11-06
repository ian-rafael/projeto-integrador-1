import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Input, Textarea } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

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
    name: false ? "" : undefined,
    code: false ? "" : undefined,
    price: false ? "" : undefined,
    description: false ? "" : undefined,
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
    <Form method="post">
      <Input
        attr={['name']}
        errorMessage={actionData?.fieldErrors?.name}
        required={true}
        label="Nome"
        type="text"
      />
      <Input
        attr={['code']}
        errorMessage={actionData?.fieldErrors?.code}
        required={true}
        label="Código"
        type="text"
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
        errorMessage={actionData?.fieldErrors?.description}
        label="Descrição"
        rows={4}
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
