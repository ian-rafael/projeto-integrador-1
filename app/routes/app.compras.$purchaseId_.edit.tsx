import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import BackLink from "~/components/BackLink";
import { ComboBox, SubmitButton, ValidationError } from "~/components/form";
import { Frame, FrameHeader } from "~/components/frame";
import Tag from "~/components/Tag";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateRequired } from "~/utils/validators";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");

  const purchase = await db.purchase.findUnique({
    select: { id: true, supplier: { select: { id: true, name: true } } },
    where: { id: params.purchaseId },
  });

  if (!purchase) {
    throw json("Purchase not found", { status: 404 });
  }

  return json({ purchase });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");

  const form = await request.formData();
  const supplierId = form.get("supplier[id]");

  if (
    typeof supplierId !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { supplier: supplierId };
  const fieldErrors = {
    supplier: validateRequired(supplierId, "Fornecedor"),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const purchase = await db.purchase.update({
    where: { id: params.purchaseId },
    data: { supplierId },
  });

  return redirect("/app/compras/" + purchase.id);
};

export default function PurchaseEdit () {
  const { purchase } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Edição da compra</h3>
      </FrameHeader>
      <Tag title="ID da compra">{purchase.id}</Tag>
      <Form method="post">
        <ComboBox
          attr={['supplier']}
          defaultValue={{id: purchase.supplier.id, label: purchase.supplier.name}}
          errorMessage={actionData?.fieldErrors?.supplier}
          url="/app/fornecedores-search"
          label="Fornecedor"
          required={true}
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
