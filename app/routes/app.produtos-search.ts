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
    select: { id: true, name: true, stock: true, price: true },
    where: {
      OR: [
        {
          name: {
            contains: escapeFilterString(term),
            mode: "insensitive",
          },
        },
        {
          code: term,
        },
      ],
    },
    take: 20,
    orderBy: [
      { stock: "desc" },
      { name: "asc" },
    ],
  });

  return json(products.map(({id, name: label, ...extra}) => ({
    id,
    label,
    extra,
  })));
};
