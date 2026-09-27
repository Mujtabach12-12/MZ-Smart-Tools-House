const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function appendWithSpacing(current, next, gap, fontSize) {
  if (!current) return next;
  if (!next) return current;
  const needsSpace = !/\s$/.test(current) && !/^\s/.test(next) && gap > Math.max(0.75, fontSize * 0.12);
  return `${current}${needsSpace ? " " : ""}${next}`;
}

/**
 * Convert PDF.js text content into editable line blocks while retaining both
 * viewport percentages and original PDF coordinates. The original PDF bytes
 * remain untouched until export.
 */
export function buildEditableTextBlocks(textContent, viewport, pdfjs) {
  const items = Array.isArray(textContent?.items) ? textContent.items : [];
  const styles = textContent?.styles || {};
  const width = Math.max(1, viewport?.width || 1);
  const height = Math.max(1, viewport?.height || 1);
  const scale = Number.isFinite(viewport?.scale) && viewport.scale > 0 ? viewport.scale : 1;
  const raw = [];

  for (const item of items) {
    const text = String(item?.str ?? "");
    if (!text.trim()) continue;
    const transform = Array.isArray(item?.transform) ? item.transform : [1, 0, 0, 10, 0, 0];
    const tx = pdfjs?.Util?.transform ? pdfjs.Util.transform(viewport.transform, transform) : transform;
    const fontHeight = Math.max(5, Math.hypot(tx?.[2] || 0, tx?.[3] || 0) || Math.hypot(transform[2] || 0, transform[3] || 0) * scale || 10);
    const left = Number(tx?.[4] || 0);
    const baseline = Number(tx?.[5] || fontHeight);
    const top = baseline - fontHeight;
    const itemWidth = Math.max(fontHeight * 0.35, Math.abs(Number(item?.width || 0) * scale));
    const pdfFontSize = Math.max(5, Math.hypot(transform[2] || 0, transform[3] || 0) || fontHeight / scale);
    const pdfX = Number(transform[4] || 0);
    const pdfY = Number(transform[5] || 0);
    const pdfWidth = Math.max(pdfFontSize * 0.35, Math.abs(Number(item?.width || 0)));
    raw.push({
      text,
      left,
      top,
      baseline,
      width: itemWidth,
      height: fontHeight * 1.14,
      fontSize: fontHeight,
      pdfX,
      pdfY,
      pdfWidth,
      pdfFontSize,
      fontFamily: String(styles[item?.fontName]?.fontFamily || "sans-serif"),
      hasEOL: Boolean(item?.hasEOL),
    });
  }

  raw.sort((a, b) => (a.top - b.top) || (a.left - b.left));
  const lines = [];
  for (const item of raw) {
    let line = lines[lines.length - 1];
    const sameLine = line && !line.forceBreak && Math.abs(line.baseline - item.baseline) <= Math.max(2.25, Math.max(line.fontSize, item.fontSize) * 0.46);
    if (!sameLine) {
      line = {
        text: item.text,
        originalText: item.text,
        left: item.left,
        top: item.top,
        right: item.left + item.width,
        bottom: item.top + item.height,
        baseline: item.baseline,
        fontSize: item.fontSize,
        pdfX: item.pdfX,
        pdfY: item.pdfY,
        pdfRight: item.pdfX + item.pdfWidth,
        pdfFontSize: item.pdfFontSize,
        fontFamily: item.fontFamily,
        forceBreak: item.hasEOL,
      };
      lines.push(line);
      continue;
    }
    const gap = item.left - line.right;
    line.text = appendWithSpacing(line.text, item.text, gap, Math.max(line.fontSize, item.fontSize));
    line.originalText = line.text;
    line.left = Math.min(line.left, item.left);
    line.top = Math.min(line.top, item.top);
    line.right = Math.max(line.right, item.left + item.width);
    line.bottom = Math.max(line.bottom, item.top + item.height);
    line.baseline = (line.baseline + item.baseline) / 2;
    line.fontSize = Math.max(line.fontSize, item.fontSize);
    line.pdfX = Math.min(line.pdfX, item.pdfX);
    line.pdfY = (line.pdfY + item.pdfY) / 2;
    line.pdfRight = Math.max(line.pdfRight, item.pdfX + item.pdfWidth);
    line.pdfFontSize = Math.max(line.pdfFontSize, item.pdfFontSize);
    line.forceBreak = item.hasEOL;
  }

  return lines.map((line, index) => {
    const blockWidth = Math.max(10, line.right - line.left);
    const blockHeight = Math.max(line.fontSize * 1.15, line.bottom - line.top);
    return {
      id: `text-${index}`,
      text: line.text,
      originalText: line.originalText,
      dirty: false,
      removed: false,
      leftPct: clamp((line.left / width) * 100, 0, 99.5),
      topPct: clamp((line.top / height) * 100, 0, 99.5),
      widthPct: clamp((blockWidth / width) * 100, 1, 100),
      heightPct: clamp((blockHeight / height) * 100, 0.75, 100),
      fontSizeViewport: line.fontSize,
      pdfX: line.pdfX,
      pdfY: line.pdfY,
      pdfWidth: Math.max(5, line.pdfRight - line.pdfX),
      pdfHeight: Math.max(5, line.pdfFontSize * 1.18),
      pdfFontSize: line.pdfFontSize,
      fontFamily: line.fontFamily,
      background: "#ffffff",
      textColor: "#111827",
    };
  });
}

export function countDirtyBlocks(pageBlocks = {}) {
  return Object.values(pageBlocks).reduce((total, blocks) => total + (Array.isArray(blocks) ? blocks.filter((block) => block?.dirty).length : 0), 0);
}

export function pageBlocksToPlainText(blocks = []) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter(Boolean)
    .sort((a, b) => (a.topPct - b.topPct) || (a.leftPct - b.leftPct))
    .map((block) => String(block.text || "").trimEnd())
    .filter(Boolean)
    .join("\n");
}

export function updateEditableBlock(blocks, blockId, updater) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    if (block.id !== blockId) return block;
    const next = typeof updater === "function" ? updater(block) : { ...block, ...updater };
    const text = String(next?.text ?? "");
    return {
      ...block,
      ...next,
      text,
      removed: text.length === 0,
      dirty: text !== String(block.originalText ?? "") || next?.background !== block.background || next?.textColor !== block.textColor,
    };
  });
}

export function restoreEditableBlock(blocks, blockId) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => block.id === blockId
    ? { ...block, text: block.originalText, removed: false, dirty: false, background: "#ffffff", textColor: "#111827" }
    : block);
}
