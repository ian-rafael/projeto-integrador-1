import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";
import invariant from "tiny-invariant";
import BackLink from "~/components/BackLink";
import { ComboBox, Input, SubmitButton, ValidationError } from "~/components/form";
import { Frame, FrameHeader } from "~/components/frame";
import Tag from "~/components/Tag";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateDate, validateRequired } from "~/utils/validators";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.loanId, "params.loanId is required");

  const loan = await db.loan.findUnique({
    select: {
      id: true,
      dueDate: true,
      customer: { select: { id: true, name: true } },
    },
    where: { id: params.loanId },
  });

  if (!loan) {
    throw json("Loan not found", { status: 404 });
  }

  return json({ loan: {
    ...loan,
    dueDate: loan.dueDate.toISOString().slice(0, 10), // apenas a data, pra evitar dor de cabeça com timezone
  } });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.loanId, "params.loanId is required");

  const form = await request.formData();
  const customerId = form.get("customer[id]");
  const dueDate = form.get("due_date");

  if (
    typeof customerId !== "string"
    || typeof dueDate !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { customer: customerId, dueDate };
  const fieldErrors = {
    customer: validateRequired(customerId, "Cliente"),
    dueDate: validateDate(dueDate, "Data de devolução"),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const loan = await db.loan.update({
    where: { id: params.loanId },
    data: { customerId, dueDate: DateTime.fromISO(dueDate).toJSDate() },
  });

  return redirect("/app/emprestimos/" + loan.id);
};

export default function LoanEdit () {
  const { loan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Edição da venda</h3>
      </FrameHeader>
      <Tag title="ID da venda">{loan.id}</Tag>
      <Form method="post">
        <ComboBox
          attr={['customer']}
          defaultValue={{id: loan.customer.id, label: loan.customer.name}}
          errorMessage={actionData?.fieldErrors?.customer}
          label="Cliente"
          required={true}
          url="/app/clientes-search"
        />
        <Input
          attr={['due_date']}
          errorMessage={actionData?.fieldErrors?.dueDate}
          defaultValue={DateTime.fromISO(loan.dueDate).toFormat('yyyy-LL-dd')}
          required={true}
          label="Data da devolução"
          type="date"
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
