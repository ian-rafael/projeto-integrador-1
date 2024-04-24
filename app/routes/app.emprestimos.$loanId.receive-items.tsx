import { $Enums } from "@prisma/client";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.loanId, "params.loanId is required");

  const loan = await db.loan.findUnique({
    select: { status: true },
    where: { id: params.loanId },
  });
  
  if (!loan) {
    return json("Loan not found", { status: 404 });
  }

  if (loan.status === $Enums.StatusEmprestimo.DEVOLVIDO) {
    return badRequest({ error: "Empréstimo já devolvido" });
  }

  const productItems = await db.productLoan.findMany({
    where: { loanId: params.loanId },
  });

  await Promise.all(productItems.map(async ({productId: id, quantity: increment}) => {
    await db.product.update({
      data: { stock: { increment } },
      where: { id },
    });
  }));

  await db.loan.update({
    data: { status: $Enums.StatusEmprestimo.DEVOLVIDO },
    where: { id: params.loanId },
  });

  return json({ ok: true });
};

export function ProductItemReceiveForm ({ loanId }: { loanId: string }) {
  const fetcher = useFetcher<typeof action>();
  const isUpdating = fetcher.state !== "idle";
  const actionUrl = "/app/emprestimos/" + loanId + "/receive-items";

  return (
    <fetcher.Form
      action={actionUrl}
      method="POST"
      className="mt-1"
    >
      <button
        disabled={isUpdating}
        type="submit"
        className="rounded-sm shadow-sm bg-slate-50 text-sm p-1 hover:brightness-95"
      >
        Confirmar devolução
      </button>
    </fetcher.Form>
  );
}
