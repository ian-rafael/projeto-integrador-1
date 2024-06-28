import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import MenuButton from "~/components/MenuButton";
import { Input, SubmitButton, ValidationError } from "~/components/form";
import { Frame, FrameHeader } from "~/components/frame";
import bcrypt from "~/utils/bcrypt.server";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const form = await request.formData();
  const password = form.get("password");
  const repeatPassword = form.get("repeat_password");

  if (
    typeof password !== "string"
    || typeof repeatPassword !== "string"
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
    <Frame>
      <FrameHeader>
        <MenuButton/>
        <h2>Escolha uma nova senha</h2>
      </FrameHeader>
      <Form method="post">
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
        <SubmitButton>Salvar</SubmitButton>
      </Form>
    </Frame>
  );
}
