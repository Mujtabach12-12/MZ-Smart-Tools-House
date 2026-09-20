function fmt(n, digits = 2) {
  return Number.isFinite(n) ? Number(n.toFixed(digits)).toString() : "—";
}

export const SIMPLE_CALCULATOR_FIELDS = {
  "tip-calculator": ["Bill amount", "Tip (%)"],
  "bill-splitter": ["Bill amount", "Number of people"],
  "tax-calculator": ["Amount before tax", "Tax rate (%)"],
  "fuel-cost-calculator": ["Fuel quantity", "Price per unit"],
  "speed-distance-time": ["Distance", "Time (hours)"],
  "pace-calculator": ["Distance", "Elapsed time (minutes)"],
  "running-pace-calculator": ["Distance", "Elapsed time (minutes)"],
  "study-hours-calculator-plus": ["Total study workload (hours)", "Days available"],
  "percentage-calculator-plus": ["Percentage (%)", "Value"],
  "marks-required-calculator": ["Target overall mark (%)", "Current mark before final (%)", "Final assessment weight (%)"],
};

function parseInputs(id, rawValues) {
  const labels = SIMPLE_CALCULATOR_FIELDS[id];
  if (!labels) throw new Error("Unknown calculator.");
  if (!Array.isArray(rawValues) || rawValues.length !== labels.length) throw new Error("Enter all required values.");
  return rawValues.map((raw, index) => {
    if (String(raw).trim() === "") throw new Error(`${labels[index]} is required.`);
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`${labels[index]} must be a valid number.`);
    return value;
  });
}

export function calculateSimpleTool(id, rawValues) {
  const values = parseInputs(id, rawValues);
  const [a, b, c] = values;

  switch (id) {
    case "tip-calculator": {
      if (a < 0) throw new Error("Bill amount cannot be negative.");
      if (b < 0) throw new Error("Tip percentage cannot be negative.");
      const tip = a * b / 100;
      return `Tip: ${fmt(tip)} | Total: ${fmt(a + tip)}`;
    }
    case "bill-splitter":
      if (a < 0) throw new Error("Bill amount cannot be negative.");
      if (!Number.isInteger(b) || b < 1) throw new Error("Number of people must be a whole number of at least 1.");
      return `Each person: ${fmt(a / b)}`;
    case "tax-calculator": {
      if (a < 0) throw new Error("Amount cannot be negative.");
      if (b < 0) throw new Error("Tax rate cannot be negative.");
      const tax = a * b / 100;
      return `Tax: ${fmt(tax)} | Total: ${fmt(a + tax)}`;
    }
    case "fuel-cost-calculator":
      if (a < 0 || b < 0) throw new Error("Fuel quantity and unit price cannot be negative.");
      return `Fuel cost: ${fmt(a * b)}`;
    case "speed-distance-time":
      if (a < 0) throw new Error("Distance cannot be negative.");
      if (b <= 0) throw new Error("Time must be greater than zero.");
      return `Speed: ${fmt(a / b)} distance-units/hour`;
    case "pace-calculator":
    case "running-pace-calculator":
      if (a <= 0) throw new Error("Distance must be greater than zero.");
      if (b < 0) throw new Error("Elapsed time cannot be negative.");
      return `${id === "running-pace-calculator" ? "Running pace" : "Pace"}: ${fmt(b / a)} min/distance-unit`;
    case "study-hours-calculator-plus":
      if (a < 0) throw new Error("Study workload cannot be negative.");
      if (!Number.isInteger(b) || b < 1) throw new Error("Days available must be a whole number of at least 1.");
      return `Required daily study: ${fmt(a / b)} hours/day`;
    case "percentage-calculator-plus":
      return `${fmt(a)}% of ${fmt(b)} = ${fmt(a * b / 100)}`;
    case "marks-required-calculator": {
      if (a < 0 || a > 100 || b < 0 || b > 100) throw new Error("Target and current marks must be between 0 and 100.");
      if (c <= 0 || c > 100) throw new Error("Final assessment weight must be greater than 0 and at most 100%.");
      const weight = c / 100;
      const required = (a - b * (1 - weight)) / weight;
      if (required < 0) return "Target is already secured from the entered weighting (required final score: 0%).";
      if (required > 100) return `Required final score: ${fmt(required)}% — the target is not reachable with a 100% final score.`;
      return `Required final score: ${fmt(required)}%`;
    }
    default:
      throw new Error("Unknown calculator.");
  }
}
