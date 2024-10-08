import { CheckIcon } from "@radix-ui/react-icons";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import invariant from "tiny-invariant";
import LoadingIcon from "~/components/LoadingIcon";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.loanId, "params.loanId is required");
  invariant(params.productId, "params.productId is required");

  const form = await request.formData();
  const quantity = form.get("quantity");

  if (
    typeof quantity !== "string"
    || Number.isNaN(+quantity)
  ) {
    return badRequest({ error: "Form submitted incorrectly" });
  }

  const record = await db.productLoan.findUnique({
    select: {
      quantity: true,
      returnedQuantity: true,
      loan: { select: { sale: { select: { id: true } } } },
    },
    where: {
      loanId_productId: {
        loanId: params.loanId,
        productId: params.productId,
      },
    },
  });

  if (!record) {
    return json({error: "Record not found"}, { status: 404 });
  }

  if (record.loan.sale) {
    return badRequest({ error: "Empréstimo fechado. A venda já foi realizada!" });
  }

  if (parseInt(quantity) > (record.quantity - record.returnedQuantity)) {
    return badRequest({ error: "Quantidade maior que o permitido!" });
  }

  await db.productLoan.update({
    where: {
      loanId_productId: {
        loanId: params.loanId,
        productId: params.productId,
      },
    },
    data: {
      returnedQuantity: {
        increment: parseInt(quantity),
      },
      product: {
        update: {
          stock: {
            increment: parseInt(quantity),
          },
        },
      },
    },
  });

  return json({ ok: true });
};

export function ProductItemReceiveForm ({loanId, productId, maxQuantity}: {loanId: string, productId: string, maxQuantity: number}) {
  const fetcher = useFetcher<typeof action>();
  const isUpdating = fetcher.state !== "idle";
  const actionUrl = "/app/emprestimos/" + loanId + "/return-item/" + productId;
  return (
    <fetcher.Form
      action={actionUrl}
      method="post"
      className="inline-flex gap-1"
    >
      <input
        autoComplete="off"
        className="h-5 leading-none w-10"
        defaultValue={maxQuantity}
        key={maxQuantity}
        max={maxQuantity}
        min={1}
        name="quantity"
        readOnly={isUpdating}
        required={true}
        type="number"
      />
      <button
        disabled={isUpdating}
        type="submit"
        className="h-5 rounded-sm shadow-sm bg-slate-50 text-sm px-1 hover:brightness-95 disabled:opacity-60"
      >
        {isUpdating ? <LoadingIcon/> : <CheckIcon/>}
      </button>
    </fetcher.Form>
  );
}
