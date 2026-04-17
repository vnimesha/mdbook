export interface Page {
  index: number;
  title: string;
  content: string;
  anchor: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface Heading {
  level: number;
  title: string;
  lineIndex: number;
}

function collectHeadings(lines: string[]): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;
  let fenceChar = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[1][0];
      } else if (fenceMatch[1][0] === fenceChar) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const h = line.match(/^(#{1,2})\s+(.+?)\s*#*\s*$/);
    if (h) {
      headings.push({ level: h[1].length, title: h[2].trim(), lineIndex: i });
    }
  }
  return headings;
}

export function paginate(md: string): Page[] {
  const lines = md.split("\n");
  const headings = collectHeadings(lines);

  const h1Count = headings.filter((h) => h.level === 1).length;
  const splitLevel = h1Count >= 2 ? 1 : 2;
  const splits = headings.filter((h) => h.level === splitLevel);

  if (splits.length === 0) {
    return [{ index: 0, title: "Page 1", content: md, anchor: "page-1" }];
  }

  const pages: Page[] = [];
  const usedAnchors = new Set<string>();
  const makeAnchor = (base: string) => {
    const slug = slugify(base) || `page-${pages.length + 1}`;
    let candidate = slug;
    let n = 2;
    while (usedAnchors.has(candidate)) candidate = `${slug}-${n++}`;
    usedAnchors.add(candidate);
    return candidate;
  };

  if (splits[0].lineIndex > 0) {
    const introContent = lines.slice(0, splits[0].lineIndex).join("\n").trim();
    if (introContent) {
      const firstHeading = headings.find((h) => h.lineIndex < splits[0].lineIndex);
      const title = firstHeading?.title ?? "Introduction";
      pages.push({
        index: 0,
        title,
        content: introContent,
        anchor: makeAnchor(title),
      });
    }
  }

  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].lineIndex;
    const end = i + 1 < splits.length ? splits[i + 1].lineIndex : lines.length;
    const content = lines.slice(start, end).join("\n").trim();
    pages.push({
      index: pages.length,
      title: splits[i].title,
      content,
      anchor: makeAnchor(splits[i].title),
    });
  }

  return pages;
}
