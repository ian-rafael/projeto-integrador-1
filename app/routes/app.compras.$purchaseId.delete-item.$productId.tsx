import { TrashIcon } from "@radix-ui/react-icons";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import invariant from "tiny-invariant";
import LoadingIcon from "~/components/LoadingIcon";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.purchaseId, "params.purchaseId is required");
  invariant(params.productId, "params.productId is required");

  const record = await db.productPurchase.findUnique({
    where: {
      purchaseId_productId: {
        purchaseId: params.purchaseId,
        productId: params.productId,
      },
    },
  });
  
  if (!record) {
    return json("Record not found", { status: 404 });
  }

  if (record.receivedQuantity > 0) {
    return badRequest({ error: "Proibido excluir itens recebidos" });
  }

  await db.productPurchase.delete({
    where: {
      purchaseId_productId: {
        purchaseId: params.purchaseId,
        productId: params.productId,
      },
    },
  });

  return json({ ok: true });
};

export function ProductItemDeleteButton ({purchaseId, productId}: {purchaseId: string, productId: string}) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";
  const action = "/app/compras/" + purchaseId + "/delete-item/" + productId;
  return (
    <fetcher.Form
      action={action}
      method="post"
      onSubmit={(event) => {
        if (
          !confirm(
            "Favor, confirme que você quer deletar esse registro."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        className="p-1 text-red-500 hover:brightness-95"
        disabled={isDeleting}
        type="submit"
      >
        {isDeleting ? <LoadingIcon/> : <TrashIcon/>}
      </button>
    </fetcher.Form>
  );
}
