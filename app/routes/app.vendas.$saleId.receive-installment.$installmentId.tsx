import { $Enums } from "@prisma/client";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { DateTime } from "luxon";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.installmentId, "params.installmentId is required");

  const form = await request.formData();
  const date = form.get("date");

  if (
    typeof date !== "string"
    || isNaN(new Date(date).getTime())
  ) {
    return badRequest({ error: "Form submitted incorrectly" });
  }

  await db.saleInstallment.update({
    where: {
      id: params.installmentId,
    },
    data: {
      status: $Enums.StatusParcela.PAGO,
      paymentDate: DateTime.fromISO(date).toJSDate(),
    },
  });

  return json({ ok: true });
};

export function SaleInstallmentPaymentForm ({saleId, installmentId}: {saleId: string, installmentId: string}) {
  const fetcher = useFetcher<typeof action>();
  const isUpdating = fetcher.state !== "idle";
  const actionUrl = "/app/vendas/" + saleId + "/receive-installment/" + installmentId;

  return (
    <fetcher.Form action={actionUrl} method="post">
      <input name="date" type="date" required={true}/>
      <button disabled={isUpdating} type="submit">Salvar</button>
    </fetcher.Form>
  );
}
