import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Input, SubmitButton, Textarea } from "~/components/form";
import Tag from "~/components/tag";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateCurrency } from "~/utils/validators";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.productId, "params.productId is required");

  const product = await db.product.findUnique({
    select: { id: true, name: true, code: true, price: true, description: true },
    where: { id: params.productId },
  });

  if (!product) {
    throw json("Product not found", { status: 404 });
  }

  return json({ product });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.productId, "params.productId is required");

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
    name: name.length < 1 ? "Nome é obrigatório" : undefined,
    code: code.length < 1 ? "Código é obrigatório" : undefined,
    price: price.length < 1 ? "Preço é obrigatório" : validateCurrency(price, "Preço"),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const product = await db.product.update({
    where: { id: params.productId },
    data: { name, code, price: Number(price), description },
  });

  return redirect("/app/produtos/" + product.id);
};

export default function ProductEdit () {
  const { product } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <Tag title="ID do produto">{product.id}</Tag>
      <h3>Edição do produto</h3>
      <Input
        attr={['name']}
        errorMessage={actionData?.fieldErrors?.name}
        required={true}
        label="Nome"
        type="text"
        defaultValue={product.name}
      />
      <Input
        attr={['code']}
        errorMessage={actionData?.fieldErrors?.code}
        required={true}
        label="Código"
        type="text"
        defaultValue={product.code}
      />
      <Input
        attr={['price']}
        errorMessage={actionData?.fieldErrors?.price}
        required={true}
        label="Preço"
        type="number"
        step=".01"
        min={0}
        defaultValue={product.price}
      />
      <Textarea
        attr={['description']}
        label="Descrição"
        rows={4}
        defaultValue={product.description || ""}
      />
      {actionData?.formError ? (
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <SubmitButton>Salvar</SubmitButton>
    </Form>
  );
}
