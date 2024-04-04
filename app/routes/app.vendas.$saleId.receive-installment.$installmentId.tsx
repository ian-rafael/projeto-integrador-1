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

  const record = await db.saleInstallment.findUnique({
    where: { id: params.installmentId },
  });

  if (!record) {
    return json({error: "Record not found"}, { status: 404 });
  }

  if (record.status === $Enums.StatusParcela.PAGO) {
    return badRequest({ error: "Parcela já está paga" });
  }

  await db.saleInstallment.update({
    where: { id: params.installmentId },
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
    <fetcher.Form
      action={actionUrl}
      method="post"
      className="inline-flex gap-1"
    >
      <input
        name="date"
        type="date"
        required={true}
        defaultValue={DateTime.now().toFormat('yyyy-LL-dd')}
        className="h-5 leading-none"
      />
      <button
        disabled={isUpdating}
        type="submit"
        className="h-5 rounded-sm shadow-sm bg-slate-50 text-sm px-1 hover:brightness-95"
      >
        Salvar
      </button>
    </fetcher.Form>
  );
}
