function assertPositive(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be zero or a positive number.`);
  return n;
}

/** Given an original price and a discount %, find the final price and savings. */
export function applyDiscount(originalPrice, discountPercent) {
  const price = assertPositive(originalPrice, "Original price");
  const percent = Number(discountPercent);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error("Discount percentage must be between 0 and 100.");
  }
  const saved = Number(((price * percent) / 100).toFixed(2));
  const finalPrice = Number((price - saved).toFixed(2));
  return { finalPrice, saved };
}

/** Given an original and a final (discounted) price, find the discount %. */
export function discountPercentFromPrices(originalPrice, finalPrice) {
  const original = assertPositive(originalPrice, "Original price");
  const final = assertPositive(finalPrice, "Final price");
  if (final > original) throw new Error("Final price cannot be greater than the original price.");
  if (original === 0) throw new Error("Original price cannot be zero.");
  const saved = Number((original - final).toFixed(2));
  const percent = Number(((saved / original) * 100).toFixed(2));
  return { percent, saved };
}
