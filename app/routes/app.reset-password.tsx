import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const form = await request.formData();
  const password = form.get("password");
  const repeatPassword = form.get("repeat-password");

  if (
    typeof password !== "string"
    || typeof password !== "string"
  ) {
    return badRequest({
      fieldErrors: null,
      formError: "Form submitted incorrectly",
    });
  }

  const fieldErrors = {
    password: password.length < 8 ? "A senha deve ter ao menos 8 caracteres" : undefined,
    repeatPassword: password !== repeatPassword ? "As senhas devem ser iguais" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      formError: null,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  return redirect("/app");
};

export default function ResetPassword () {
  const actionData = useActionData<typeof action>();
  return (
    <div className="reset-password">
      <Form method="post">
        <h2>Escolha uma nova senha</h2>
        <div className="form-element-container">
          <label htmlFor="password-input">Nova senha</label>
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
        <div className="form-element-container">
          <label htmlFor="repeat-password-input">Repita a senha:</label>
          <input
            id="repeat-password-input"
            name="repeat-password"
            type="password"
            required={true}
            aria-invalid={Boolean(actionData?.fieldErrors?.repeatPassword)}
            aria-errormessage={actionData?.fieldErrors?.repeatPassword ? "repeat-password-error" : undefined}
          />
          {actionData?.fieldErrors?.repeatPassword ? (
            <p className="form-validation-error" id="repeat-password-error" role="alert">
              {actionData.fieldErrors.repeatPassword}
            </p>
          ) : null}
        </div>
        {actionData?.formError ? (
          <p className="form-validation-error" role="alert">{actionData.formError}</p>
        ) : null}
        <button type="submit">Salvar</button>
      </Form>
    </div>
  );
}
