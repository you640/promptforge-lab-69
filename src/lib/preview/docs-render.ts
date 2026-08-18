import type { CanvasFile } from "@/lib/canvas-types";

/** Minimalistický escape pre vkladanie do HTML náhľadu. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Malý markdown render (bez závislostí) — nadpisy, kód, zoznamy, odkazy. */
export function renderMarkdown(md: string): string {
  const blocks = md.split(/```/);
  return blocks
    .map((block, index) => {
      if (index % 2 === 1) return `<pre><code>${esc(block.replace(/^\w+\n/, ""))}</code></pre>`;
      return block
        .split(/\n{2,}/)
        .map((para) => {
          const heading = /^(#{1,6})\s+(.*)$/.exec(para.trim());
          if (heading) {
            const level = heading[1]!.length;
            return `<h${level}>${esc(heading[2]!)}</h${level}>`;
          }
          if (/^\s*[-*+]\s+/m.test(para)) {
            const items = para
              .split("\n")
              .filter((l) => /^\s*[-*+]\s+/.test(l))
              .map((l) => `<li>${inline(l.replace(/^\s*[-*+]\s+/, ""))}</li>`)
              .join("");
            return `<ul>${items}</ul>`;
          }
          if (!para.trim()) return "";
          return `<p>${inline(para)}</p>`;
        })
        .join("\n");
    })
    .join("\n");
}

function inline(text: string): string {
  return esc(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noreferrer noopener">$1</a>')
    .replace(/\n/g, "<br>");
}

function renderJson(content: string): string {
  try {
    return `<pre><code>${esc(JSON.stringify(JSON.parse(content), null, 2))}</code></pre>`;
  } catch {
    return `<pre><code>${esc(content)}</code></pre>`;
  }
}

function renderCss(content: string): string {
  return `<style>${content}</style>
<p class="hint">Živá ukážka štýlov z tohto súboru:</p>
<div class="demo">
  <h1>Nadpis H1</h1><h2>Nadpis H2</h2>
  <p>Odstavec textu s <a href="#">odkazom</a> a <code>kódom</code>.</p>
  <button>Tlačidlo</button> <input placeholder="Vstup" />
  <ul><li>Položka jeden</li><li>Položka dva</li></ul>
</div>`;
}

/** Vykreslí čitateľný náhľad projektu bez spustiteľného frontend kódu. */
export function renderDocsPreview(files: CanvasFile[], selected?: string): string {
  const docs = files.filter((f) => /\.(md|json|css|svg|ya?ml|txt)$/i.test(f.path));
  const file = docs.find((f) => f.path === selected) ?? docs.find((f) => /readme\.md$/i.test(f.path)) ?? docs[0];
  const svgs = files.filter((f) => f.path.endsWith(".svg")).slice(0, 12);
  if (!file) return `<p class="hint">V projekte nie sú dokumenty ani assety na zobrazenie.</p>`;

  let body: string;
  if (/\.md$/i.test(file.path)) body = renderMarkdown(file.content);
  else if (/\.json$/i.test(file.path)) body = renderJson(file.content);
  else if (/\.css$/i.test(file.path)) body = renderCss(file.content);
  else if (/\.svg$/i.test(file.path)) body = file.content;
  else body = `<pre><code>${esc(file.content)}</code></pre>`;

  const gallery =
    svgs.length > 0 && !file.path.endsWith(".svg")
      ? `<h3>SVG assety</h3><div class="gallery">${svgs
          .map(
            (s) =>
              `<figure><div class="thumb">${s.content}</div><figcaption>${esc(s.path)}</figcaption></figure>`,
          )
          .join("")}</div>`
      : "";

  return `<p class="file">${esc(file.path)}</p>${body}${gallery}`;
}
