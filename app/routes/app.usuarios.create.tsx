import { redirect, type ActionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  const name = form.get("name");
  const username = form.get("username");
  const password = form.get("password");

  if (
    typeof name !== "string"
    || typeof username !== "string"
    || typeof password !== "string"
  ) {
    return badRequest({
      fields: null,
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fields = { name, username, password };
  const fieldErrors = {
    name: false ? "" : undefined,
    username: false ? "" : undefined,
    password: false ? "" : undefined,
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
      <div className="form-element-container">
        <label htmlFor="name-input">Nome</label>
        <input
          id="name-input"
          name="name"
          type="text"
          required={true}
          aria-invalid={Boolean(actionData?.fieldErrors?.name)}
          aria-errormessage={actionData?.fieldErrors?.name ? "name-error" : undefined}
        />
        {actionData?.fieldErrors?.name ? (
          <p className="form-validation-error" id="name-error" role="alert">
            {actionData.fieldErrors.name}
          </p>
        ) : null}
      </div>
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
          id="password-input"
          name="password"
          type="password"
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
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <button type="submit">Criar</button>
    </Form>
  )
}
