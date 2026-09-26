const DAY_MS = 86_400_000;

function parseDateOnly(value, label) {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) throw new Error(`${label} must be a valid date.`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${label} must be a valid calendar date.`);
  }
  return { year, month, day, epochDay: Math.floor(date.getTime() / DAY_MS) };
}

function daysInMonthUTC(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonthsClamped(date, monthsToAdd) {
  const total = date.year * 12 + (date.month - 1) + monthsToAdd;
  const year = Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  const month = monthIndex + 1;
  const day = Math.min(date.day, daysInMonthUTC(year, month));
  return parseDateOnly(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, "Calculated date");
}

function localTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calendar age based on whole calendar months plus remaining days.
 * Date-only arithmetic is performed in UTC to avoid timezone/DST shifts.
 */
export function calculateAge(dob, asOf = localTodayISO()) {
  const birth = parseDateOnly(dob, "Date of birth");
  const reference = parseDateOnly(asOf, "Reference date");
  if (birth.epochDay > reference.epochDay) {
    throw new Error("Date of birth cannot be in the future relative to the reference date.");
  }

  let totalMonths = (reference.year - birth.year) * 12 + (reference.month - birth.month);
  let anchor = addMonthsClamped(birth, totalMonths);
  if (anchor.epochDay > reference.epochDay) {
    totalMonths -= 1;
    anchor = addMonthsClamped(birth, totalMonths);
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const days = reference.epochDay - anchor.epochDay;
  const totalDays = reference.epochDay - birth.epochDay;

  return { years, months, days, totalDays };
}

export function getLocalTodayISO() {
  return localTodayISO();
}
