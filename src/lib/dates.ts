import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  addDays,
  format,
  parseISO,
  startOfWeek,
  differenceInCalendarDays,
} from "date-fns";

export const DHAKA_TZ = "Asia/Dhaka";

/** Calendar date string YYYY-MM-DD in Asia/Dhaka for an instant. */
export function dhakaDateString(date: Date = new Date()): string {
  return formatInTimeZone(date, DHAKA_TZ, "yyyy-MM-dd");
}

/** Tomorrow's calendar date in Asia/Dhaka. */
export function dhakaTomorrowString(date: Date = new Date()): string {
  const today = dhakaDateString(date);
  const noonUtc = fromZonedTime(`${today}T12:00:00`, DHAKA_TZ);
  return dhakaDateString(addDays(noonUtc, 1));
}

/** Human-readable long date in Dhaka, e.g. Thursday, 26 November */
export function formatDhakaLong(dateStr: string): string {
  const noon = fromZonedTime(`${dateStr}T12:00:00`, DHAKA_TZ);
  return formatInTimeZone(noon, DHAKA_TZ, "EEEE, d MMMM");
}

/** Greeting based on Dhaka local hour. */
export function dhakaGreeting(date: Date = new Date()): string {
  const hour = Number(formatInTimeZone(date, DHAKA_TZ, "H"));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Monday (weekStartsOn: 1) of the week containing dateStr, as YYYY-MM-DD Dhaka. */
export function weekStartMonday(dateStr: string): string {
  const noon = fromZonedTime(`${dateStr}T12:00:00`, DHAKA_TZ);
  const zoned = toZonedTime(noon, DHAKA_TZ);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

/** Seven Monday–Sunday dates for the week of dateStr. */
export function weekDayStrings(dateStr: string): string[] {
  const start = weekStartMonday(dateStr);
  return Array.from({ length: 7 }, (_, i) => {
    const noon = fromZonedTime(`${start}T12:00:00`, DHAKA_TZ);
    return dhakaDateString(addDays(noon, i));
  });
}

/** Stable day index 0–29 for rotating motivational messages. */
export function messageDayIndex(dateStr: string): number {
  const epoch = parseISO("2024-01-01");
  const day = parseISO(dateStr);
  const diff = differenceInCalendarDays(day, epoch);
  return ((diff % 30) + 30) % 30;
}

export function isSameDhakaDay(a: string, b: string): boolean {
  return a === b;
}
