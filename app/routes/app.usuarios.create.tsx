import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import { Input, SubmitButton, ValidationError } from "~/components/form";
import bcrypt from "~/utils/bcrypt.server";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { validateMinLength, validateRequired } from "~/utils/validators";
import { validateUniqueUsername } from "~/utils/db-validators.server";

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
    name: validateRequired(name, "Nome"),
    username: validateRequired(username, "Nome de usuário") || (await validateUniqueUsername(username)),
    password: validateRequired(password, "Senha") || validateMinLength(password, 8, "Senha"),
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
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Novo usuário</h3>
      </FrameHeader>
      <Form method="post">
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
    </Frame>
  );
}
