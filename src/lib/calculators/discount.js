function parseNonNegative(value, label) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(`${label} is required.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a valid number greater than or equal to 0.`);
  return n;
}

/** Given an original price and a discount %, find the final price and savings. */
export function applyDiscount(originalPrice, discountPercent) {
  const price = parseNonNegative(originalPrice, "Original price");
  const percent = parseNonNegative(discountPercent, "Discount percentage");
  if (percent > 100) throw new Error("Discount percentage must be between 0 and 100.");

  const saved = (price * percent) / 100;
  const finalPrice = price - saved;
  if (!Number.isFinite(saved) || !Number.isFinite(finalPrice)) {
    throw new Error("The values are too large to calculate safely.");
  }
  return { finalPrice, saved };
}

/** Given an original and a final (discounted) price, find the discount %. */
export function discountPercentFromPrices(originalPrice, finalPrice) {
  const original = parseNonNegative(originalPrice, "Original price");
  const final = parseNonNegative(finalPrice, "Final price");
  if (original === 0) throw new Error("Original price must be greater than 0 when calculating a discount percentage.");
  if (final > original) throw new Error("Final price cannot be greater than the original price for a discount.");

  const saved = original - final;
  const percent = (saved / original) * 100;
  if (!Number.isFinite(percent)) throw new Error("The values are too large to calculate safely.");
  return { percent, saved };
}
