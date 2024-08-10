import { json, type LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { escapeFilterString } from "~/utils/helper";
import { maskCNPJ } from "~/utils/masks";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const term = url.searchParams.get("term");

  invariant(typeof term === "string", "Term is required");

  const suppliers = await db.supplier.findMany({
    select: { id: true, name: true },
    where: {
      OR: [
        {
          name: {
            contains: escapeFilterString(term),
            mode: "insensitive",
          },
        },
        { cnpj: maskCNPJ(term) },
      ],
    },
    take: 20,
  });

  return json(suppliers.map((data) => ({
    id: data.id,
    label: data.name,
  })));
};
