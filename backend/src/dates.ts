import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { addDays, format, startOfWeek } from "date-fns";

export const DHAKA_TZ = "Asia/Dhaka";

export function dhakaDateString(date: Date = new Date()): string {
  return formatInTimeZone(date, DHAKA_TZ, "yyyy-MM-dd");
}

export function dhakaTomorrowString(date: Date = new Date()): string {
  const today = dhakaDateString(date);
  const noonUtc = fromZonedTime(`${today}T12:00:00`, DHAKA_TZ);
  return dhakaDateString(addDays(noonUtc, 1));
}

export function weekStartMonday(dateStr: string): string {
  const noon = fromZonedTime(`${dateStr}T12:00:00`, DHAKA_TZ);
  const zoned = toZonedTime(noon, DHAKA_TZ);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

/** First day of the Dhaka calendar month for dateStr (YYYY-MM-DD). */
export function monthStartDay(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}
