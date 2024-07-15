import { db } from "./db.server";

export async function validateUniqueCPF (cpf: string, notId?: string) {
  const NOT = notId ? { id: notId }: undefined;
  const result = await db.customer.findUnique({ where: { cpf, NOT } })
  if (result) {
    return "Já existe um cliente com esse CPF";
  }
}

export async function validateUniqueCNPJ (cnpj: string, notId?: string) {
  const NOT = notId ? { id: notId }: undefined;
  const result = await db.supplier.findUnique({ where: { cnpj, NOT } })
  if (result) {
    return "Já existe um fornecedor com esse CNPJ";
  }
}

export async function validateUniqueUsername (username: string, notId?: string) {
  const NOT = notId ? { id: notId }: undefined;
  const result = await db.user.findUnique({ where: { username, NOT } })
  if (result) {
    return "Já existe um usuário com esse nome de usuário";
  }
}

export async function validateUniqueProductCode (code: string, notId?: string) {
  const NOT = notId ? { id: notId }: undefined;
  const result = await db.product.findUnique({ where: { code, NOT } })
  if (result) {
    return "Já existe um produto com esse código";
  }
}
