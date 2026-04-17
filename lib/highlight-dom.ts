import { HIGHLIGHT_COLORS, type Highlight } from "./reader-storage";

// ── Text-node walking ────────────────────────────────────────────────────────

function textNodes(container: Element): Text[] {
  const result: Text[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = (node.parentElement?.tagName ?? "").toLowerCase();
      if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) result.push(n as Text);
  return result;
}

interface NodeRange {
  node: Text;
  gStart: number; // global char offset from container start
  gEnd: number;
}

function buildNodeRanges(container: Element): NodeRange[] {
  const nodes = textNodes(container);
  let offset = 0;
  return nodes.map((node) => {
    const entry = { node, gStart: offset, gEnd: offset + node.length };
    offset += node.length;
    return entry;
  });
}

// ── Offset extraction from a live Range ─────────────────────────────────────

export function getRangeOffsets(
  range: Range,
  container: Element,
): { startOffset: number; endOffset: number } | null {
  const nodes = textNodes(container);
  let offset = 0;
  let start = -1;
  let end = -1;

  for (const tn of nodes) {
    if (tn === range.startContainer) start = offset + range.startOffset;
    if (tn === range.endContainer) {
      end = offset + range.endOffset;
      break;
    }
    offset += tn.length;
  }

  if (start < 0 || end < 0) return null;
  return { startOffset: start, endOffset: end };
}

// ── Inject a <mark> into the DOM ─────────────────────────────────────────────

export function injectMark(
  container: Element,
  h: Pick<Highlight, "id" | "startOffset" | "endOffset" | "color">,
) {
  const ranges = buildNodeRanges(container);
  const overlapping = ranges.filter(
    (r) => r.gEnd > h.startOffset && r.gStart < h.endOffset,
  );

  // Process in reverse so earlier nodes' positions aren't shifted
  for (let i = overlapping.length - 1; i >= 0; i--) {
    const { node, gStart } = overlapping[i];
    if (!node.parentNode) continue;

    const localStart = Math.max(0, h.startOffset - gStart);
    const localEnd = Math.min(node.length, h.endOffset - gStart);
    if (localStart >= localEnd) continue;

    const text = node.textContent ?? "";
    const mark = document.createElement("mark");
    mark.setAttribute("data-hl-id", h.id);
    mark.setAttribute("data-hl-color", h.color);
    mark.style.cssText = `background:${HIGHLIGHT_COLORS[h.color]};border-radius:2px;cursor:pointer;padding:0 1px;`;
    mark.textContent = text.slice(localStart, localEnd);

    const frag = document.createDocumentFragment();
    const before = text.slice(0, localStart);
    const after = text.slice(localEnd);
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(mark);
    if (after) frag.appendChild(document.createTextNode(after));
    node.parentNode.replaceChild(frag, node);
  }
}

// ── Remove a <mark> from the DOM ─────────────────────────────────────────────

export function removeMark(container: Element, highlightId: string) {
  container
    .querySelectorAll(`mark[data-hl-id="${CSS.escape(highlightId)}"]`)
    .forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
  container.normalize();
}
