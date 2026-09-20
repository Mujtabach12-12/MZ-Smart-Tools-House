function add(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new TypeError("Numbers required");
  return a + b;
}
console.log(add(2, 3));
