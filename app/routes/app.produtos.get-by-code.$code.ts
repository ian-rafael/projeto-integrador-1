import { json, type LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.code, "params.code is required");

  const product = await db.product.findUnique({
    select: { id: true, code: true, name: true, price: true, stock: true },
    where: { code: params.code },
  });

  return json({ product });
};
