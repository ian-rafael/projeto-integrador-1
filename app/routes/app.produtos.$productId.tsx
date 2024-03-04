import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import BackLink from "~/components/BackLink";
import { Frame, FrameHeader } from "~/components/frame";
import Tag from "~/components/Tag";
import { Actions, Item, List } from "~/components/view";
import { db } from "~/utils/db.server";
import { formatCurrency, formatDateHour } from "~/utils/formatters";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.productId, "params.productId is required");

  const product = await db.product.findUnique({
    select: {
      id: true,
      code: true,
      createdAt: true,
      description: true,
      name: true,
      price: true,
      stock: true,
    },
    where: { id: params.productId },
  });

  if (!product) {
    throw json("Product not found", { status: 404 });
  }

  return json({ product });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.productId, "params.productId is required");

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await db.product.delete({
      where: { id: params.productId },
    });
    return redirect("/app/produtos");
  }
  return badRequest({
    formError: "Intent precisa ser 'delete'",
  });
};

export default function ProductView () {
  const { product } = useLoaderData<typeof loader>();
  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Produto</h3>
      </FrameHeader>
      <Tag title="ID do produto">{product.id}</Tag>
      <List>
        <Item title="Nome">
          {product.name}
        </Item>
        <Item title="Código">
          {product.code}
        </Item>
        <Item title="Preço">
          {formatCurrency(product.price)}
        </Item>
        <Item title="Estoque">
          {product.stock}
        </Item>
        <Item title="Descrição">
          {product.description}
        </Item>
        <Item title="Criado em">
          {formatDateHour(product.createdAt)}
        </Item>
      </List>
      <Actions/>
    </Frame>
  );
}
