export function colName(index) {
  let n = Number(index) + 1;
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

export function cellKey(row, col) {
  return `${colName(col)}${Number(row) + 1}`;
}

export function parseRef(ref) {
  const match = String(ref).trim().toUpperCase().match(/^([A-Z]+)([1-9]\d*)$/);
  if (!match) return null;
  let col = 0;
  for (const char of match[1]) col = col * 26 + (char.charCodeAt(0) - 64);
  return { row: Number(match[2]) - 1, col: col - 1, key: `${match[1]}${match[2]}` };
}

export function rangeKeys(range) {
  const [start, end] = String(range).split(":").map(parseRef);
  if (!start) return [];
  if (!end) return [start.key];
  const out = [];
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row += 1) {
    for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col += 1) {
      out.push(cellKey(row, col));
    }
  }
  return out;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function splitArgs(text) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const char of String(text)) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      out.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function resolveCondition(text, resolve) {
  const match = String(text || "").match(/^(.+?)\s*(>=|<=|<>|=|>|<)\s*(.+)$/);
  if (!match) return Boolean(resolve(text));
  const left = resolve(match[1]);
  const right = resolve(match[3]);
  if (match[2] === "=") return left == right; // Spreadsheet-style loose equality is intentional.
  if (match[2] === "<>") return left != right;
  if (match[2] === ">") return Number(left) > Number(right);
  if (match[2] === "<") return Number(left) < Number(right);
  if (match[2] === ">=") return Number(left) >= Number(right);
  return Number(left) <= Number(right);
}

export function computeCell(sheet, key, stack = new Set()) {
  if (!sheet?.cells) return "";
  if (stack.has(key)) return "#CYCLE!";
  const raw = sheet.cells[key] ?? "";
  if (typeof raw !== "string" || !raw.startsWith("=")) return raw;

  const next = new Set(stack);
  next.add(key);
  const resolve = (token) => {
    const text = String(token).trim();
    const ref = parseRef(text);
    if (ref) return computeCell(sheet, ref.key, next);
    if (/^".*"$/.test(text)) return text.slice(1, -1);
    if (/^true$/i.test(text)) return true;
    if (/^false$/i.test(text)) return false;
    const number = Number(text);
    return Number.isFinite(number) ? number : text;
  };
  const values = (token) => rangeKeys(token).map((cell) => computeCell(sheet, cell, next));
  const expr = raw.slice(1).trim();
  const functionCall = expr.match(/^([A-Z]+)\((.*)\)$/i);

  if (functionCall) {
    const name = functionCall[1].toUpperCase();
    const args = splitArgs(functionCall[2]);
    const flatten = () => args.flatMap((arg) => (arg.includes(":") ? values(arg) : [resolve(arg)]));
    const numbers = () => flatten().map(Number).filter(Number.isFinite);

    if (name === "SUM") return numbers().reduce((a, b) => a + b, 0);
    if (name === "AVERAGE") {
      const list = numbers();
      return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
    }
    if (name === "MIN") {
      const list = numbers();
      return list.length ? Math.min(...list) : 0;
    }
    if (name === "MAX") {
      const list = numbers();
      return list.length ? Math.max(...list) : 0;
    }
    if (name === "COUNT") return numbers().length;
    if (name === "COUNTA") return flatten().filter((value) => String(value) !== "").length;
    if (name === "ROUND") {
      const precision = Math.max(0, Math.min(10, Number(resolve(args[1])) || 0));
      return Number(toNumber(resolve(args[0])).toFixed(precision));
    }
    if (name === "ROUNDUP" || name === "ROUNDDOWN") {
      const precision = Math.max(0, Math.min(10, Number(resolve(args[1])) || 0));
      const factor = 10 ** precision;
      const value = toNumber(resolve(args[0]));
      const rounded = name === "ROUNDUP"
        ? (value >= 0 ? Math.ceil(value * factor) : Math.floor(value * factor))
        : (value >= 0 ? Math.floor(value * factor) : Math.ceil(value * factor));
      return rounded / factor;
    }
    if (name === "ABS") return Math.abs(toNumber(resolve(args[0])));
    if (name === "MOD") {
      const left = toNumber(resolve(args[0]));
      const right = toNumber(resolve(args[1]));
      return right === 0 ? "#DIV/0!" : ((left % right) + right) % right;
    }
    if (name === "CONCAT" || name === "CONCATENATE") return flatten().map((value) => String(value ?? "")).join("");
    if (name === "LEN") return String(resolve(args[0]) ?? "").length;
    if (name === "LEFT") {
      const text = String(resolve(args[0]) ?? "");
      const count = Math.max(0, Number(resolve(args[1])) || 1);
      return text.slice(0, count);
    }
    if (name === "RIGHT") {
      const text = String(resolve(args[0]) ?? "");
      const count = Math.max(0, Number(resolve(args[1])) || 1);
      return count ? text.slice(-count) : "";
    }
    if (name === "MID") {
      const text = String(resolve(args[0]) ?? "");
      const start = Math.max(1, Number(resolve(args[1])) || 1) - 1;
      const count = Math.max(0, Number(resolve(args[2])) || 0);
      return text.slice(start, start + count);
    }
    if (name === "TODAY") return new Date().toISOString().slice(0, 10);
    if (name === "NOW") return new Date().toISOString();
    if (name === "AND") return flatten().every(Boolean);
    if (name === "OR") return flatten().some(Boolean);
    if (name === "IF") {
      const condition = resolveCondition(args[0], resolve);
      return resolve(condition ? args[1] : args[2]);
    }
    return "#NAME?";
  }

  const arithmetic = expr.match(/^([A-Z]+[1-9]\d*|-?\d+(?:\.\d+)?)\s*([+\-*/])\s*([A-Z]+[1-9]\d*|-?\d+(?:\.\d+)?)$/i);
  if (arithmetic) {
    const left = toNumber(resolve(arithmetic[1]));
    const right = toNumber(resolve(arithmetic[3]));
    if (arithmetic[2] === "+") return left + right;
    if (arithmetic[2] === "-") return left - right;
    if (arithmetic[2] === "*") return left * right;
    if (arithmetic[2] === "/") return right === 0 ? "#DIV/0!" : left / right;
  }

  const direct = parseRef(expr);
  if (direct) return resolve(direct.key);
  return "#FORMULA?";
}

export function formatValue(value, format) {
  if (value === "" || value == null) return "";
  if (format?.number === "percentage" && Number.isFinite(Number(value))) return `${(Number(value) * 100).toFixed(2)}%`;
  if (format?.number === "currency" && Number.isFinite(Number(value))) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value));
  }
  if (format?.number === "date") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
  }
  return String(value);
}
