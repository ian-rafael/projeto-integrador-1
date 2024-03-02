import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Input, SubmitButton, ValidationError } from "~/components/form";
import { badRequest } from "~/utils/request.server";
import { createUserSession, login } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");

  if (
    typeof username !== "string"
    || typeof password !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { username, password };
  const fieldErrors = {
    username: username.length < 1 ? "Nome de usuário é obrigatório" : undefined,
    password: password.length < 1 ? "Senha é obrigatório" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null
    });
  }

  const user = await login({ username, password });
  if (!user) {
    return badRequest({
      fields,
      fieldErrors: null,
      formError: "Combinação nome de usuário/senha está incorreta",
    });
  }

  let redirectTo = "/app";
  if (user.firstLogin) {
    redirectTo += "/reset-password";
  }

  return createUserSession(user.id, redirectTo);
};

export default function Login () {
  const actionData = useActionData<typeof action>();
  return (
    <div className="h-screen grid place-items-center bg-slate-100">
      <Form method="post" className="bg-slate-200 p-8 rounded min-w-80 max-w-80">
        <h1 className="mb-8">Login</h1>
        <Input
          attr={['username']}
          errorMessage={actionData?.fieldErrors?.username}
          label="Nome de usuário"
          required={true}
          type="text"
        />
        <Input
          attr={['password']}
          errorMessage={actionData?.fieldErrors?.password}
          label="Senha"
          required={true}
          type="password"
        />
        {actionData?.formError ? (
          <ValidationError>
            {actionData.formError}
          </ValidationError>
        ) : null}
        <SubmitButton>Entrar</SubmitButton>
      </Form>
    </div>
  );
}
