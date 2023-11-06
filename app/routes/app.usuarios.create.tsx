import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { Input } from "~/components/form";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);

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

  const fields = { name, username };
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
        required={true}
        type="password"
      />
      {actionData?.formError ? (
        <p className="form-validation-error" role="alert">
          {actionData.formError}
        </p>
      ) : null}
      <button type="submit">Criar</button>
    </Form>
  );
}
