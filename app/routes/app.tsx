import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { isRouteErrorResponse, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import Layout from "~/components/Layout";
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

export function ErrorBoundary () {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Erro</h1>
        <p>{error.message}</p>
        <p>O rastreamento de pilha é:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Erro desconhecido</h1>;
  }
}
