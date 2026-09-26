const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function requireText(value, label = "input") {
  const text = String(value ?? "");
  if (!text.trim()) throw new Error(`Enter ${label}.`);
  return text;
}

export function parseJson(text) {
  requireText(text, "JSON");
  try { return JSON.parse(text); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    throw new Error(`Invalid JSON: ${message}`);
  }
}
export function formatJson(text) { return JSON.stringify(parseJson(text), null, 2); }
export function minifyJson(text) { return JSON.stringify(parseJson(text)); }
export function validateJson(text) { parseJson(text); return "Valid JSON"; }

function bytesToBase64(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += BASE64_ALPHABET[(triple >>> 18) & 63];
    out += BASE64_ALPHABET[(triple >>> 12) & 63];
    out += i + 1 < bytes.length ? BASE64_ALPHABET[(triple >>> 6) & 63] : "=";
    out += i + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] : "=";
  }
  return out;
}
function base64ToBytes(value) {
  const compact = String(value ?? "").replace(/[\t\n\r ]+/g, "");
  if (compact === "") return new Uint8Array();
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) throw new Error("Invalid Base64 input. Check the characters and padding.");
  const firstPad = compact.indexOf("=");
  if (firstPad >= 0 && firstPad < compact.length - 2) throw new Error("Invalid Base64 padding.");
  if (compact.length % 4 === 1) throw new Error("Invalid Base64 length.");
  const padded = compact.padEnd(Math.ceil(compact.length / 4) * 4, "=");
  const output = [];
  for (let i = 0; i < padded.length; i += 4) {
    const chars = padded.slice(i, i + 4);
    const vals = [...chars].map((ch) => ch === "=" ? 0 : BASE64_ALPHABET.indexOf(ch));
    if (vals.some((n) => n < 0)) throw new Error("Invalid Base64 input.");
    const triple = (vals[0] << 18) | (vals[1] << 12) | (vals[2] << 6) | vals[3];
    output.push((triple >>> 16) & 255);
    if (chars[2] !== "=") output.push((triple >>> 8) & 255);
    if (chars[3] !== "=") output.push(triple & 255);
  }
  return new Uint8Array(output);
}
export function encodeBase64Text(text) {
  return bytesToBase64(new TextEncoder().encode(String(text ?? "")));
}
export function encodeBase64Bytes(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return bytesToBase64(view);
}
export function decodeBase64Text(value) {
  const bytes = base64ToBytes(value);
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new Error("The Base64 value decoded to bytes that are not valid UTF-8 text."); }
}
export function decodeBase64Bytes(value) { return base64ToBytes(value); }

export function encodeUrl(value, mode = "component") {
  const text = requireText(value, "text or a URL");
  if (mode === "full-url") {
    try { return new URL(text).href; }
    catch { throw new Error("Enter a complete URL such as https://example.com/path?q=value."); }
  }
  return encodeURIComponent(text);
}
export function decodeUrl(value, mode = "component") {
  const text = requireText(value, "encoded text or URL");
  try { return mode === "full-url" ? decodeURI(text) : decodeURIComponent(text); }
  catch { throw new Error("Malformed percent-encoding. Check each % sequence and try again."); }
}

const HTML_BLOCK_TAGS = new Set(["address","article","aside","blockquote","body","div","dl","dt","dd","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hr","html","li","main","nav","ol","p","pre","section","table","tbody","thead","tfoot","tr","td","th","ul"]);
const HTML_VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);

function readHtmlTokens(source) {
  const tokens = [];
  let i = 0;
  let rawTag = null;
  while (i < source.length) {
    if (rawTag) {
      const closeIndex = source.toLowerCase().indexOf(`</${rawTag}`, i);
      if (closeIndex < 0) { tokens.push({ type: "text", value: source.slice(i) }); break; }
      if (closeIndex > i) tokens.push({ type: "text", value: source.slice(i, closeIndex), raw: true });
      i = closeIndex;
      rawTag = null;
      continue;
    }
    if (source.startsWith("<!--", i)) {
      const end = source.indexOf("-->", i + 4);
      if (end < 0) throw new Error("HTML comment is not closed.");
      tokens.push({ type: "comment", value: source.slice(i, end + 3) });
      i = end + 3;
      continue;
    }
    if (source[i] !== "<") {
      const next = source.indexOf("<", i);
      const end = next < 0 ? source.length : next;
      tokens.push({ type: "text", value: source.slice(i, end) });
      i = end;
      continue;
    }
    let j = i + 1;
    let quote = null;
    for (; j < source.length; j += 1) {
      const ch = source[j];
      if (quote) {
        if (ch === quote && source[j - 1] !== "\\") quote = null;
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === ">") break;
    }
    if (j >= source.length) throw new Error("HTML tag is not closed with >.");
    const raw = source.slice(i, j + 1);
    const match = raw.match(/^<\s*(\/)?\s*([A-Za-z][\w:-]*)/);
    const tag = match?.[2]?.toLowerCase() || "";
    const closing = Boolean(match?.[1]);
    const selfClosing = /\/\s*>$/.test(raw) || HTML_VOID_TAGS.has(tag) || /^<!/.test(raw) || /^<\?/.test(raw);
    tokens.push({ type: "tag", value: raw, tag, closing, selfClosing, block: HTML_BLOCK_TAGS.has(tag) });
    if (!closing && !selfClosing && (tag === "script" || tag === "style" || tag === "pre" || tag === "textarea")) rawTag = tag;
    i = j + 1;
  }
  return tokens;
}

export function formatHtml(source) {
  const input = requireText(source, "HTML");
  const tokens = readHtmlTokens(input);
  const lines = [];
  let current = "";
  let indent = 0;
  const blockStack = [];
  const flush = () => { if (current.trim()) lines.push(`${"  ".repeat(indent)}${current.trim()}`); current = ""; };
  const rawTags = new Set(["pre", "textarea", "script", "style"]);
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    if (token.type === "tag" && !token.closing && !token.selfClosing && rawTags.has(token.tag)) {
      const rawText = tokens[tokenIndex + 1];
      const closing = tokens[tokenIndex + 2];
      if (rawText?.type === "text" && rawText.raw && closing?.type === "tag" && closing.closing && closing.tag === token.tag) {
        flush();
        lines.push(`${"  ".repeat(indent)}${token.value}${rawText.value}${closing.value}`);
        tokenIndex += 2;
        continue;
      }
    }
    if (token.type === "text") {
      if (token.raw) { current += token.value; continue; }
      const value = token.value.replace(/\s+/g, " ");
      if (value.trim()) current += value;
      continue;
    }
    if (token.type === "comment") { flush(); lines.push(`${"  ".repeat(indent)}${token.value.trim()}`); continue; }
    if (token.block && token.closing) {
      const expected = blockStack.pop();
      if (expected !== token.tag) throw new Error(`Mismatched HTML block tag: expected </${expected || "none"}> but found </${token.tag}>.`);
      flush(); indent = Math.max(0, indent - 1); lines.push(`${"  ".repeat(indent)}${token.value.trim()}`); continue;
    }
    if (token.block) {
      flush();
      lines.push(`${"  ".repeat(indent)}${token.value.trim()}`);
      if (!token.selfClosing) { indent += 1; blockStack.push(token.tag); }
      continue;
    }
    current += token.value;
  }
  flush();
  if (indent !== 0 || blockStack.length) throw new Error("HTML has unbalanced block-level tags.");
  return lines.join("\n");
}

function formatDelimitedCode(source, language) {
  const input = requireText(source, language === "css" ? "CSS" : "JavaScript");
  const lines = [];
  let current = "";
  let indent = 0;
  let state = "normal";
  let quote = "";
  let escape = false;
  let paren = 0;
  let bracket = 0;
  let regexClass = false;
  let lastSignificant = "";
  const stack = [];

  const emitLine = () => {
    const text = current.replace(/[ \t]+$/g, "").trimStart();
    if (text) lines.push(`${"  ".repeat(Math.max(0, indent))}${text}`);
    current = "";
  };
  const appendSpace = () => {
    if (current && !/[\s]$/.test(current)) current += " ";
  };
  const canStartRegex = () => !lastSignificant || /[({[,:;=!?&|+\-*%^~<>]/.test(lastSignificant);

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];

    if (state === "line-comment") {
      if (ch === "\n") { emitLine(); state = "normal"; }
      else current += ch;
      continue;
    }
    if (state === "block-comment") {
      current += ch;
      if (ch === "*" && next === "/") { current += next; i += 1; state = "normal"; }
      continue;
    }
    if (state === "string" || state === "template") {
      current += ch;
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if ((state === "string" && ch === quote) || (state === "template" && ch === "`")) state = "normal";
      continue;
    }
    if (state === "regex") {
      current += ch;
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === "[") regexClass = true;
      else if (ch === "]") regexClass = false;
      else if (ch === "/" && !regexClass) {
        state = "normal";
        while (/[A-Za-z]/.test(input[i + 1] || "")) { current += input[i + 1]; i += 1; }
      }
      continue;
    }

    if (ch === "/" && next === "/" && language === "js") { current += "//"; i += 1; state = "line-comment"; continue; }
    if (ch === "/" && next === "*") { current += "/*"; i += 1; state = "block-comment"; continue; }
    if (ch === '"' || ch === "'") { state = "string"; quote = ch; current += ch; lastSignificant = ch; continue; }
    if (ch === "`" && language === "js") { state = "template"; current += ch; lastSignificant = ch; continue; }
    if (ch === "/" && language === "js" && canStartRegex()) { state = "regex"; regexClass = false; current += ch; lastSignificant = ch; continue; }

    if (ch === "(") { paren += 1; stack.push(ch); current += ch; lastSignificant = ch; continue; }
    if (ch === ")") { paren -= 1; if (paren < 0 || stack.pop() !== "(") throw new Error("Unbalanced parentheses."); current += ch; lastSignificant = ch; continue; }
    if (ch === "[") { bracket += 1; stack.push(ch); current += ch; lastSignificant = ch; continue; }
    if (ch === "]") { bracket -= 1; if (bracket < 0 || stack.pop() !== "[") throw new Error("Unbalanced brackets."); current += ch; lastSignificant = ch; continue; }

    if (ch === "{") {
      stack.push(ch);
      current = current.replace(/[ \t]+$/g, "");
      if (current && language === "css" && !/[\s]$/.test(current)) current += " ";
      current += "{";
      emitLine();
      indent += 1;
      lastSignificant = ch;
      continue;
    }
    if (ch === "}") {
      if (stack.pop() !== "{") throw new Error("Unbalanced braces.");
      emitLine();
      indent -= 1;
      current = "}";
      emitLine();
      lastSignificant = ch;
      continue;
    }
    if (ch === ";" && paren === 0 && bracket === 0) {
      current += ";";
      emitLine();
      lastSignificant = ch;
      continue;
    }
    if (language === "css" && ch === ":" && paren === 0 && bracket === 0) {
      current = current.replace(/[ \t]+$/g, "");
      current += ": ";
      while (input[i + 1] === " ") i += 1;
      lastSignificant = ch;
      continue;
    }
    if (/\s/.test(ch)) { appendSpace(); continue; }
    current += ch;
    lastSignificant = ch;
  }

  if (state === "string" || state === "template") throw new Error("A quoted string or template literal is not closed.");
  if (state === "block-comment") throw new Error("A block comment is not closed.");
  if (state === "regex") throw new Error("A regular-expression literal is not closed.");
  if (stack.length || paren !== 0 || bracket !== 0 || indent !== 0) throw new Error("The source contains unbalanced delimiters.");
  emitLine();
  return lines.join("\n").trim();
}
export function formatCss(source) { return formatDelimitedCode(source, "css"); }
export function formatJavaScript(source) { return formatDelimitedCode(source, "js"); }

export function executeRegexCore({ pattern, flags = "g", text = "", maxMatches = 1000 }) {
  if (String(pattern).length > 500) throw new Error("Pattern is too long. Keep it under 500 characters.");
  if (String(text).length > 500000) throw new Error("Test text is too large. Keep it under 500,000 characters.");
  const uniqueFlags = [...new Set(String(flags).split(""))].join("");
  if (!/^[dgimsuvy]*$/.test(uniqueFlags)) throw new Error("Unsupported regular-expression flags.");
  let re;
  try { re = new RegExp(pattern, uniqueFlags.includes("g") ? uniqueFlags : `${uniqueFlags}g`); }
  catch (error) { throw new Error(`Invalid regular expression: ${error.message}`); }
  const matches = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    matches.push({
      match: match[0],
      index: match.index,
      groups: match.slice(1),
      namedGroups: match.groups || null,
    });
    if (matches.length >= maxMatches) break;
    if (match[0] === "") re.lastIndex += 1;
  }
  return { matches, truncated: matches.length >= maxMatches };
}

function parseBigIntBase(input, base) {
  const raw = requireText(input, "a number").trim();
  const sign = raw.startsWith("-") ? -1n : 1n;
  const unsigned = /^[+-]/.test(raw) ? raw.slice(1) : raw;
  const body = base === 16 ? unsigned.replace(/^0x/i, "") : base === 2 ? unsigned.replace(/^0b/i, "") : unsigned;
  const pattern = base === 2 ? /^[01]+$/ : base === 16 ? /^[0-9a-f]+$/i : /^\d+$/;
  if (!pattern.test(body)) throw new Error(`Enter a valid base-${base} integer.`);
  let value = 0n;
  const digits = body.toLowerCase();
  for (const ch of digits) {
    const digit = ch >= "0" && ch <= "9" ? ch.charCodeAt(0) - 48 : ch.charCodeAt(0) - 87;
    value = value * BigInt(base) + BigInt(digit);
  }
  return sign * value;
}
export function convertInteger(input, base) {
  const n = parseBigIntBase(input, base);
  return { decimal: n.toString(10), binary: n.toString(2), hex: n.toString(16).toUpperCase() };
}

const DATE_LIMIT_MS = 8.64e15;
export function timestampToDate(input, unit = "seconds") {
  const raw = requireText(input, "a Unix timestamp").trim();
  if (!/^[+-]?\d+$/.test(raw)) throw new Error("Unix timestamps must be whole numbers.");
  const n = BigInt(raw);
  let msBig;
  if (unit === "seconds") msBig = n * 1000n;
  else if (unit === "milliseconds") msBig = n;
  else if (unit === "microseconds") msBig = n / 1000n;
  else throw new Error("Unsupported timestamp unit.");
  const ms = Number(msBig);
  if (!Number.isFinite(ms) || Math.abs(ms) > DATE_LIMIT_MS) throw new Error("Timestamp is outside JavaScript's supported date range.");
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp.");
  return {
    date,
    iso: date.toISOString(),
    seconds: Math.trunc(ms / 1000).toString(),
    milliseconds: Math.trunc(ms).toString(),
    microseconds: (BigInt(Math.trunc(ms)) * 1000n).toString(),
  };
}
export function dateToTimestamps(input) {
  const text = requireText(input, "an ISO date/time");
  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) throw new Error("Enter a valid ISO date/time, preferably including a timezone such as Z or +05:00.");
  return {
    iso: new Date(ms).toISOString(),
    seconds: Math.trunc(ms / 1000).toString(),
    milliseconds: Math.trunc(ms).toString(),
    microseconds: (BigInt(Math.trunc(ms)) * 1000n).toString(),
  };
}

function secureIndex(max, cryptoObject = globalThis.crypto) {
  if (!cryptoObject?.getRandomValues) throw new Error("Secure random generation is unavailable in this browser.");
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do { cryptoObject.getRandomValues(buf); } while (buf[0] >= limit);
  return buf[0] % max;
}
export function generateUuidV4(cryptoObject = globalThis.crypto) {
  if (cryptoObject?.randomUUID) return cryptoObject.randomUUID();
  if (!cryptoObject?.getRandomValues) throw new Error("Secure UUID generation is unavailable in this browser.");
  const bytes = new Uint8Array(16);
  cryptoObject.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0,4).join("")}-${hex.slice(4,6).join("")}-${hex.slice(6,8).join("")}-${hex.slice(8,10).join("")}-${hex.slice(10).join("")}`;
}

const PASSWORD_CLASSES = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  numbers: "23456789",
  symbols: "!@#$%^&*_-+=?",
};
export function generateSecurePassword(length, options = {}, cryptoObject = globalThis.crypto) {
  const n = Number(length);
  if (!Number.isInteger(n) || n < 8 || n > 128) throw new Error("Password length must be a whole number from 8 to 128.");
  const enabled = Object.entries(PASSWORD_CLASSES).filter(([key]) => options[key] !== false);
  if (!enabled.length) throw new Error("Select at least one character group.");
  if (n < enabled.length) throw new Error("Password length is too short for the selected character groups.");
  const pool = enabled.map(([, chars]) => chars).join("");
  const chars = enabled.map(([, group]) => group[secureIndex(group.length, cryptoObject)]);
  while (chars.length < n) chars.push(pool[secureIndex(pool.length, cryptoObject)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = secureIndex(i + 1, cryptoObject);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export async function sha256Text(text, cryptoObject = globalThis.crypto) {
  if (!cryptoObject?.subtle?.digest) throw new Error("SHA-256 is unavailable because Web Crypto is not supported in this context.");
  const hash = await cryptoObject.subtle.digest("SHA-256", new TextEncoder().encode(String(text ?? "")));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToRgb(value) {
  const raw = requireText(value, "a HEX color").trim().replace(/^#/, "");
  const expanded = /^[0-9a-f]{3}$/i.test(raw) ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) throw new Error("Enter a 3-digit or 6-digit HEX color, for example #336699.");
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
    hex: `#${expanded.toUpperCase()}`,
  };
}
export function rgbToHex(r, g, b) {
  const values = [r, g, b].map((value) => Number(value));
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) throw new Error("RGB channels must be whole numbers from 0 to 255.");
  return `#${values.map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function escapeHtmlText(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export function unescapeHtmlText(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
  return String(value ?? "").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi, (full, entity) => {
    const key = entity.toLowerCase();
    if (key.startsWith("#x")) {
      const cp = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(cp) && cp <= 0x10ffff ? String.fromCodePoint(cp) : full;
    }
    if (key.startsWith("#") && /^#\d+$/.test(key)) {
      const cp = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(cp) && cp <= 0x10ffff ? String.fromCodePoint(cp) : full;
    }
    return named[key] ?? full;
  });
}

const LOREM_PARAGRAPHS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec id elit non mi porta gravida at eget metus. Maecenas faucibus mollis interdum.",
  "Curabitur blandit tempus porttitor. Aenean lacinia bibendum nulla sed consectetur. Cras mattis consectetur purus sit amet fermentum.",
  "Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam quis risus eget urna mollis ornare vel eu leo. Vestibulum id ligula porta felis euismod semper.",
];
export function generateLorem(paragraphCount = 1) {
  const count = Number(paragraphCount);
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error("Paragraph count must be a whole number from 1 to 20.");
  return Array.from({ length: count }, (_, index) => LOREM_PARAGRAPHS[index % LOREM_PARAGRAPHS.length]).join("\n\n");
}
