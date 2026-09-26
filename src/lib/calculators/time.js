function parseDurationUnit(value, label, { max = null } = {}) {
  if (value === null || value === undefined || String(value).trim() === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
  if (n < 0) throw new Error(`${label} cannot be negative.`);
  if (max !== null && n > max) throw new Error(`${label} must be between 0 and ${max}.`);
  return n;
}

function toSeconds({ h = 0, m = 0, s = 0 }) {
  const hh = parseDurationUnit(h, "Hours");
  const mm = parseDurationUnit(m, "Minutes", { max: 59 });
  const ss = parseDurationUnit(s, "Seconds", { max: 59 });
  const total = hh * 3600 + mm * 60 + ss;
  if (!Number.isSafeInteger(total)) throw new Error("This duration is too large to calculate safely.");
  return total;
}

function fromSeconds(totalSeconds) {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  return {
    h: Math.floor(abs / 3600),
    m: Math.floor((abs % 3600) / 60),
    s: abs % 60,
    negative,
  };
}

/** Add or subtract two non-negative durations. */
export function combineDurations(duration1, duration2, operation = "add") {
  if (!["add", "subtract"].includes(operation)) throw new Error("Operation must be add or subtract.");
  const s1 = toSeconds(duration1);
  const s2 = toSeconds(duration2);
  const total = operation === "subtract" ? s1 - s2 : s1 + s2;
  return fromSeconds(total);
}

/**
 * Difference between two clock times "HH:MM" (24h). If end is earlier than
 * start, the interval is treated as crossing midnight.
 */
export function clockTimeDifference(startHHMM, endHHMM) {
  const parse = (value, label) => {
    const text = String(value ?? "").trim();
    if (!text) throw new Error(`${label} is required.`);
    const match = /^(\d{1,2}):(\d{2})$/.exec(text);
    if (!match) throw new Error(`${label} must be in HH:MM format.`);
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) throw new Error(`${label} is not a valid 24-hour time.`);
    return h * 60 + m;
  };

  const startMin = parse(startHHMM, "Start time");
  const endMin = parse(endHHMM, "End time");
  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60;
  return { h: Math.floor(diff / 60), m: diff % 60 };
}
