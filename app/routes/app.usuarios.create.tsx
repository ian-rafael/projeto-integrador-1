import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { Input, SubmitButton, ValidationError } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

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
    password: password.length < 8 ? "A senha deve ter ao menos 8 caracteres" : undefined,
    repeatPassword: password !== repeatPassword ? "As senhas devem ser iguais" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, username, passwordHash },
  });

  return redirect("/app/usuarios/" + user.id);
};

export default function UserCreate () {
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <h3>Novo usuário</h3>
      <Input
        attr={['name']}
        defaultValue={actionData?.fields?.name}
        errorMessage={actionData?.fieldErrors?.name}
        label="Nome"
        required={true}
        type="text"
      />
      <Input
        attr={['username']}
        defaultValue={actionData?.fields?.username}
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
        required={true}
        type="password"
      />
      <Input
        attr={['repeat_password']}
        errorMessage={actionData?.fieldErrors?.repeatPassword}
        label="Repita a senha"
        minLength={8}
        required={true}
        type="password"
      />
      {actionData?.formError ? (
        <ValidationError>
          {actionData.formError}
        </ValidationError>
      ) : null}
      <SubmitButton>Criar</SubmitButton>
    </Form>
  );
}
