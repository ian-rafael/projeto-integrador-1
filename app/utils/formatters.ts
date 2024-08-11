import {DateTime} from "luxon";

export function formatCurrency (value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatDate (value: string | Date) {
  // não faz new Date(value) para caso vier só yyyy-mm-dd setar o zone para local
  const resolvedDate = value instanceof Date ? value.toISOString() : value;
  return DateTime.fromISO(resolvedDate, {zone: 'local'})
    .toLocaleString(DateTime.DATE_SHORT, {locale: 'pt-BR'});
}

export function formatDateHour (value: string | Date) {
  // não faz new Date(value) para caso vier só yyyy-mm-dd setar o zone para local
  const resolvedDate = value instanceof Date ? value.toISOString() : value;
  return DateTime.fromISO(resolvedDate, {zone: 'local'})
    .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS, {locale: 'pt-BR'});
}
