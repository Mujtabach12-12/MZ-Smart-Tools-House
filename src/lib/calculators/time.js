function toSeconds({ h = 0, m = 0, s = 0 }) {
  const hh = Number(h) || 0;
  const mm = Number(m) || 0;
  const ss = Number(s) || 0;
  if (hh < 0 || mm < 0 || mm > 59 || ss < 0 || ss > 59) {
    throw new Error("Minutes/seconds must be 0-59, and hours cannot be negative.");
  }
  return hh * 3600 + mm * 60 + ss;
}

function fromSeconds(totalSeconds) {
  const sign = totalSeconds < 0 ? -1 : 1;
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  return { h: h * sign, m, s, negative: sign < 0 };
}

/**
 * Add or subtract two durations (h/m/s each).
 * operation: "add" | "subtract"
 */
export function combineDurations(duration1, duration2, operation = "add") {
  const s1 = toSeconds(duration1);
  const s2 = toSeconds(duration2);
  const total = operation === "subtract" ? s1 - s2 : s1 + s2;
  return fromSeconds(total);
}

/**
 * Difference between two clock times "HH:MM" (24h). Handles overnight spans
 * (end earlier than start is treated as crossing midnight).
 */
export function clockTimeDifference(startHHMM, endHHMM) {
  const parse = (value, label) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
    if (!match) throw new Error(`${label} must be in HH:MM format.`);
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) throw new Error(`${label} is not a valid 24-hour time.`);
    return h * 60 + m;
  };

  const startMin = parse(startHHMM, "Start time");
  const endMin = parse(endHHMM, "End time");

  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60; // crossed midnight

  return { h: Math.floor(diff / 60), m: diff % 60 };
}
