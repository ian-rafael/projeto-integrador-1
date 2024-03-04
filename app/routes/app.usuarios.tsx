import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Index from "~/components/Index";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const users = await db.user.findMany({
    select: { id: true, name: true },
  });
  return json({ users });
};

export default function Users () {
  const { users } = useLoaderData<typeof loader>();
  return (
    <Index rows={users} title="Usuários">
      <Outlet/>
    </Index>
  );
}
