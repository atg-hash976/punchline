const CT_TIME_ZONE = "America/Chicago";

/**
 * Minutes to add to a UTC instant to get its wall-clock time in `timeZone`.
 * Reads the actual IANA tz database via Intl, so DST transitions are handled
 * correctly instead of a hardcoded offset (see README's timezone TODO).
 */
function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

/**
 * Converts a CT wall-clock date + time (as an admin would type it, e.g.
 * "2026-08-10" + "10:00") into the correct UTC instant.
 */
export function ctWallTimeToUTC(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  const naiveGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(naiveGuess, CT_TIME_ZONE);

  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMinutes * 60000);
}

/** Calendar date (YYYY-MM-DD) that `date` falls on in CT. */
export function dateStringInCT(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CT_TIME_ZONE }).format(date);
}

/** Today's (or offsetDays from today's) date in CT, as "YYYY-MM-DD" — for form defaults. */
export function dateInCT(offsetDays = 0): string {
  return dateStringInCT(new Date(Date.now() + offsetDays * 86400000));
}

/** Human-readable CT date label for a comic's releaseAt, e.g. "August 9, 2026" — for the archive. */
export function dateLabelCT(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CT_TIME_ZONE,
    dateStyle: "long",
  }).format(new Date(iso));
}
