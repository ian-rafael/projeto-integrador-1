import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
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
    <div id="login">
      <Form method="post">
        <h1>Login</h1>
        <div className="form-element-container">
          <label htmlFor="username-input">Nome de usuário</label>
          <input
            id="username-input"
            name="username"
            type="text"
            required={true}
            aria-invalid={Boolean(actionData?.fieldErrors?.username)}
            aria-errormessage={actionData?.fieldErrors?.username ? "username-error" : undefined}
          />
          {actionData?.fieldErrors?.username ? (
            <p className="form-validation-error" id="username-error" role="alert">
              {actionData.fieldErrors.username}
            </p>
          ) : null}
        </div>
        <div className="form-element-container">
          <label htmlFor="password-input">Senha</label>
          <input
            type="password"
            name="password"
            id="password-input"
            required={true}
            aria-invalid={Boolean(actionData?.fieldErrors?.password)}
            aria-errormessage={actionData?.fieldErrors?.password ? "password-error" : undefined}
          />
          {actionData?.fieldErrors?.password ? (
            <p className="form-validation-error" id="password-error" role="alert">
              {actionData.fieldErrors.password}
            </p>
          ) : null}
        </div>
        {actionData?.formError ? (
          <p className="form-validation-error" role="alert">{actionData.formError}</p>
        ) : null}
        <button type="submit">Entrar</button>
      </Form>
    </div>
  );
}
