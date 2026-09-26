export function formatCalculatorNumber(value, maximumFractionDigits = 10) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    useGrouping: true,
  }).format(value);
}

export function formatFixedFlexible(value, maximumFractionDigits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
    useGrouping: true,
  }).format(value);
}
