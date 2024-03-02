export function formatCurrency (value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatDate (value: string | Date) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatDateHour (value: string | Date) {
  return new Date(value).toLocaleString("pt-BR");
}
