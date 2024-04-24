import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";
import { useEffect } from "react";
import { $Enums } from "@prisma/client";
import { formatDate, formatDateHour } from "~/utils/formatters";
import Tag from "~/components/Tag";
import { Actions, Item, List, Table } from "~/components/view";
import { Frame, FrameHeader } from "~/components/frame";
import BackLink from "~/components/BackLink";
import { ProductItemReceiveForm } from "./app.emprestimos.$loanId.receive-items";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUserId(request);

  invariant(params.loanId, "params.loanId is required");

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete") {
    const loan = await db.loan.findUniqueOrThrow({
      where: { id: params.loanId },
    });

    // Mesmo que o empréstimo tivesse uma venda, daria pra deletar (ON DELETE SET NULL),
    // mas quando cria uma venda, o emprestimo é setado pra DEVOLVIDO
    // então cai na condição abaixo
    if (loan.status === $Enums.StatusEmprestimo.DEVOLVIDO) {
      return badRequest({ formError: "Erro ao deletar: Esse registro já foi devolvido" });
    }

    // Seria bom botar a condição abaixo pra deixar explicito que só deve
    // retornar pro estoque caso esteja pendente. Mas tanto faz
    // if (loan.status === $Enums.StatusEmprestimo.PENDENTE) { }
    const productItems = await db.productLoan.findMany({
      where: { loanId: params.loanId },
    });

    await Promise.all(productItems.map(async ({productId: id, quantity: increment}) => {
      await db.product.update({
        data: { stock: { increment } },
        where: { id },
      });
    }));

    await db.loan.delete({
      where: { id: params.loanId },
    });

    return redirect("/app/emprestimos");
  }

  return badRequest({ formError: "Erro: Intent precisa ser 'delete'" });
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request);

  invariant(params.loanId, "params.loanId is required");

  const loan = await db.loan.findUnique({
    select: {
      createdAt: true,
      dueDate: true,
      customer: { select: { id: true, name: true } },
      sale: { select: { id: true } },
      id: true,
      status: true,
      productItems: {
        select: {
          product: { select: { name: true } },
          productId: true,
          quantity: true,
          unitPrice: true,
        }
      },
    },
    where: { id: params.loanId },
  });

  if (!loan) {
    throw json("Loan not found", { status: 404 });
  }

  return json({
    loan: {
      id: loan.id,
      createdAt: loan.createdAt,
      dueDate: loan.dueDate,
      customerId: loan.customer.id,
      customerName: loan.customer.name,
      saleId: loan.sale?.id,
      status: loan.status,
      productItems: loan.productItems.map((data) => ({
        productName: data.product.name,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
      })),
    },
  });
};

export default function LoanView () {
  const actionData = useActionData<typeof action>();
  const { loan } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (actionData?.formError) {
      window.alert(actionData.formError);
    }
  }, [actionData]);

  return (
    <Frame>
      <FrameHeader>
        <BackLink/>
        <h3>Empréstimo</h3>
      </FrameHeader>
      <Tag title="ID do empréstimo">{loan.id}</Tag>
      <List>
        <Item title="Cliente">
          <Link
            className="hover:underline"
            to={`/app/clientes/${loan.customerId}`}
          >
            {loan.customerName}
          </Link>
        </Item>
        <Item title="Data de devolução">
          {formatDate(loan.dueDate)}
        </Item>
        <Item title="Criado em">
          {formatDateHour(loan.createdAt)}
        </Item>
        <Item title="Status">
          {loan.status === $Enums.StatusEmprestimo.PENDENTE ? "Pendente" : "Devolvido"}
          {loan.status === $Enums.StatusEmprestimo.PENDENTE && <ProductItemReceiveForm loanId={loan.id}/>}
        </Item>
        <Item title="Produtos">
          <Table
            cols={[
              {
                label: 'Nome',
                property: 'productName',
                type: 'text',
              },
              {
                label: 'Qtd.',
                property: 'quantity',
                type: 'text',
              },
              {
                label: 'Preço unit.',
                property: 'unitPrice',
                type: 'currency',
              },
            ]}
            rows={loan.productItems}
            idKey="productId"
          />
        </Item>
        <Item title="Venda">
          {loan.saleId ? (
            <Link
              to={`/app/vendas/${loan.saleId}`}
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              #{loan.saleId}
            </Link>
          ) : (
            <Link
              to={`/app/vendas/create?loanId=${loan.id}`}
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Criar venda
            </Link>
          )}
        </Item>
      </List>
      <Actions/>
    </Frame>
  );
}
