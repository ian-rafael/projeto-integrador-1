import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import invariant from "tiny-invariant";
import BackLink from "~/components/BackLink";
import { Input, SubmitButton, ValidationError } from "~/components/form";
import { Frame, FrameHeader } from "~/components/frame";
import Tag from "~/components/Tag";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.userId, "params.userId is required");

  const user = await db.user.findUnique({
    select: { id: true, name: true, username: true },
    where: { id: params.userId },
  });

  if (!user) {
    throw json("User not found", { status: 404 });
  }

  return json({ user });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.userId, "params.userId is required");

  const form = await request.formData();
  const name = form.get("name");
  const username = form.get("username");
  const password = form.get("password");
  const repeatPassword = form.get("repeat_password");

  if (
    typeof name !== "string"
    || typeof username !== "string"
    || typeof password !== "string"
    || typeof repeatPassword !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { name, username };
  const fieldErrors = {
    name: name.length < 1 ? "Nome é obrigatório" : undefined,
    username: username.length < 1 ? "Nome de usuário é obrigatório" : undefined,
    password: password && password.length < 8 ? "A senha deve ter ao menos 8 caracteres" : undefined,
    repeatPassword: password !== repeatPassword ? "As senhas devem ser iguais" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  let data: { name: string, username: string, passwordHash?: string} = { name, username };
  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    data = {...data, passwordHash};
  }
  const user = await db.user.update({
    where: { id: params.userId },
    data,
  });

  return redirect("/app/usuarios/" + user.id);
};

export default function UserEdit () {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Edição do usuário</h3>
      </FrameHeader>
      <Tag title="ID do usuário">{user.id}</Tag>
      <Form method="post">
        <Input
          attr={['name']}
          defaultValue={user.name}
          errorMessage={actionData?.fieldErrors?.name}
          label="Nome"
          required={true}
          type="text"
        />
        <Input
          attr={['username']}
          defaultValue={user.username}
          errorMessage={actionData?.fieldErrors?.username}
          label="Nome de usuário"
          required={true}
          type="text"
        />
        <Input
          attr={['password']}
          errorMessage={actionData?.fieldErrors?.password}
          label="Senha"
          minLength={8}
          type="password"
        />
        <Input
          attr={['repeat_password']}
          errorMessage={actionData?.fieldErrors?.repeatPassword}
          label="Repita a senha"
          minLength={8}
          type="password"
        />
        {actionData?.formError ? (
          <ValidationError>
            {actionData.formError}
          </ValidationError>
        ) : null}
        <SubmitButton>Salvar</SubmitButton>
      </Form>
    </Frame>
  );
}
