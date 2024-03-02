import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Layout from "~/components/layout";
import { getUser } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }
  return json({ user });
};

export default function App () {
  const { user } = useLoaderData<typeof loader>();
  return (
    <Layout user={user}>
      <Outlet/>
    </Layout>
  );
}
