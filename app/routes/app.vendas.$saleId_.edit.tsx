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

  invariant(params.saleId, "params.saleId is required");

  const sale = await db.sale.findUnique({
    select: { id: true, customer: { select: { id: true, name: true } } },
    where: { id: params.saleId },
  });

  if (!sale) {
    throw json("Sale not found", { status: 404 });
  }

  return json({ sale });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.saleId, "params.saleId is required");

  const form = await request.formData();
  const customerId = form.get("customer[id]");

  if (
    typeof customerId !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { customer: customerId };
  const fieldErrors = {
    customer: validateRequired(customerId, "Cliente"),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const sale = await db.sale.update({
    where: { id: params.saleId },
    data: { customerId },
  });

  return redirect("/app/vendas/" + sale.id);
};

export default function SaleEdit () {
  const { sale } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Edição da venda</h3>
      </FrameHeader>
      <Tag title="ID da venda">{sale.id}</Tag>
      <Form method="post">
        <ComboBox
          attr={['customer']}
          defaultValue={{id: sale.customer.id, label: sale.customer.name}}
          errorMessage={actionData?.fieldErrors?.customer}
          label="Cliente"
          required={true}
          url="/app/clientes-search"
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
