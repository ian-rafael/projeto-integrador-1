import { DateTime } from "luxon";

export function escapeFilterString (text: string) {
  return text.replace(/[%_]/g, (match: string) => `\\${match}`);
}

export function getStartOfDay (date: string | number | Date) {
  return DateTime.fromJSDate(new Date(date)).startOf("day").toJSDate();
}
