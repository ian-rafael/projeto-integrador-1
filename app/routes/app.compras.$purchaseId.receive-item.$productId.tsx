import { CheckIcon } from "@radix-ui/react-icons";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import LoadingIcon from "~/components/LoadingIcon";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");
  invariant(params.productId, "params.productId is required");

  const form = await request.formData();
  const quantity = form.get("quantity");

  if (
    typeof quantity !== "string"
    || Number.isNaN(+quantity)
  ) {
    return badRequest({ error: "Form submitted incorrectly" });
  }

  const record = await db.productPurchase.findUnique({
    where: {
      purchaseId_productId: {
        purchaseId: params.purchaseId,
        productId: params.productId,
      },
    },
  });

  if (!record) {
    return json({error: "Record not found"}, { status: 404 });
  }

  if (parseInt(quantity) > (record.quantity - record.receivedQuantity)) {
    return badRequest({ error: "Quantidade maior que o permitido" });
  }

  await db.productPurchase.update({
    where: {
      purchaseId_productId: {
        productId: params.productId,
        purchaseId: params.purchaseId,
      },
    },
    data: {
      receivedQuantity: {
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

export function ProductItemReceiveForm ({purchaseId, productId, maxQuantity}: {purchaseId: string, productId: string, maxQuantity: number}) {
  const fetcher = useFetcher<typeof action>();
  const isUpdating = fetcher.state !== "idle";
  const actionUrl = "/app/compras/" + purchaseId + "/receive-item/" + productId;
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
