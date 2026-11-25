import {
  dhakaDateString,
  dhakaTomorrowString,
  messageDayIndex,
  weekStartMonday,
} from "../src/lib/dates";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sample = new Date("2026-11-26T18:00:00+06:00");
assert(dhakaDateString(sample) === "2026-11-26", "dhaka today");
assert(dhakaTomorrowString(sample) === "2026-11-27", "dhaka tomorrow");
assert(weekStartMonday("2026-11-26") === "2026-11-23", "monday week start");
assert(messageDayIndex("2026-11-26") >= 0 && messageDayIndex("2026-11-26") < 30, "msg idx");

console.log("date checks passed");
