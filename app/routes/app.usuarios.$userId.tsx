import { json, redirect, type ActionArgs, type LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.userId, "params.userId is required");

  const user = await db.user.findUnique({
    select: { name: true, username: true, createdAt: true },
    where: { id: params.userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return json({ user, isAdmin: user.username === "administrador" });
};

export const action = async ({ request, params }: ActionArgs) => {
  invariant(params.userId, "params.userId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await db.user.delete({
      where: { id: params.userId },
    });
    return redirect("/app/usuarios");
  }
  return badRequest({
    formError: "Intent precisa ser 'delete'",
  });
};

export default function UserView () {
  const { user, isAdmin } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="view-item">
        <b>Nome: </b>
        <span>{user.name}</span>
      </div>
      <div className="view-item">
        <b>Nome de usuário: </b>
        <span>{user.username}</span>
      </div>
      <div className="view-item">
        <b>Criado em: </b>
        <span>{new Date(user.createdAt).toLocaleString()}</span>
      </div>
      {!isAdmin ? (
        <div className="view-actions">
          <Link to="edit">Editar</Link>
          <Form method="post" onSubmit={(event) => {
            if (
              !confirm(
                "Favor, confirme que você quer deletar esse registro."
              )
            ) {
              event.preventDefault();
            }
          }}>
            <button name="intent" value="delete" type="submit">
              Deletar
            </button>
          </Form>
        </div>
      ) : null}
    </div>
  );
}
