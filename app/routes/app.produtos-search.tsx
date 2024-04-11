import { json, type LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { escapeFilterString } from "~/utils/helper";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const term = url.searchParams.get("term");

  invariant(typeof term === "string", "Term is required");

  const products = await db.product.findMany({
    select: { id: true, name: true },
    where: {
      name: {
        contains: escapeFilterString(term),
        mode: "insensitive",
      },
    },
    take: 20,
  });

  return json(products.map((data) => ({
    id: data.id,
    label: data.name,
  })));
};
