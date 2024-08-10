import { json, type LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { escapeFilterString } from "~/utils/helper";
import { maskCPF } from "~/utils/masks";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const term = url.searchParams.get("term");

  invariant(typeof term === "string", "Term is required");

  const customers = await db.customer.findMany({
    select: { id: true, name: true },
    where: {
      OR: [
        {
          name: {
            contains: escapeFilterString(term),
            mode: "insensitive",
          },
        },
        { cpf: maskCPF(term) },
      ]
    },
    take: 20,
  });

  return json(customers.map(({id, name: label}) => ({id, label})));
};
