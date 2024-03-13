import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import Tag from "~/components/Tag";
import { Actions, Item, List } from "~/components/view";
import { db } from "~/utils/db.server";
import { formatDateHour } from "~/utils/formatters";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.userId, "params.userId is required");

  const user = await db.user.findUnique({
    select: { id: true, name: true, username: true, createdAt: true },
    where: { id: params.userId },
  });

  if (!user) {
    throw json("User not found", { status: 404 });
  }

  return json({ user, isAdmin: user.username === "administrador" });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.userId, "params.userId is required");

  const recordUser = await db.user.findUnique({
    select: { username: true },
    where: {id: params.userId},
  });
  if (recordUser?.username === "administrador") {
    throw json("Forbidden", { status: 403 });
  }

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
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Usuário</h3>
      </FrameHeader>
      <Tag title="ID do usuário">{user.id}</Tag>
      <List>
        <Item title="Nome">
          {user.name}
        </Item>
        <Item title="Nome de usuário">
          {user.username}
        </Item>
        <Item title="Criado em">
          {formatDateHour(user.createdAt)}
        </Item>
      </List>
      {!isAdmin ? <Actions/> : null}
    </Frame>
  );
}
