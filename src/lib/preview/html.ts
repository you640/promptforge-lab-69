import type { CanvasFile } from "@/lib/canvas-types";

/** Skript v iframe: prepošle konzolu a runtime chyby do canvasu. */
const BRIDGE = `<script>
(function(){
  var send=function(level,args,stack){
    try{parent.postMessage({source:"canvas-preview",level:level,message:args,stack:stack||null},"*")}catch(e){}
  };
  var fmt=function(list){return Array.prototype.map.call(list,function(a){
    if(a instanceof Error) return a.stack||a.message;
    if(typeof a==="object") { try{return JSON.stringify(a)}catch(e){return String(a)} }
    return String(a);
  }).join(" ")};
  ["log","info","warn","error","debug"].forEach(function(level){
    var orig=console[level].bind(console);
    console[level]=function(){ send(level==="debug"?"log":level, fmt(arguments)); orig.apply(null,arguments); };
  });
  window.addEventListener("error", function(e){
    send("error", e.message + (e.filename?" ("+e.filename+":"+e.lineno+")":""), e.error&&e.error.stack);
  });
  window.addEventListener("unhandledrejection", function(e){
    var r=e.reason; send("error", "Unhandled rejection: "+((r&&(r.message||r))||"")+"", r&&r.stack);
  });
  send("status","ready");
})();
</script>`;

const BASE_STYLE = `<style>
  :root{color-scheme:light dark}
  html,body{margin:0}
  body{font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding:0}
  .canvas-docs{padding:24px;max-width:820px;margin:0 auto}
  .canvas-docs .file{font:12px ui-monospace,monospace;opacity:.6;margin:0 0 12px}
  .canvas-docs pre{background:rgba(127,127,127,.14);padding:12px;border-radius:8px;overflow:auto}
  .canvas-docs code{font:13px ui-monospace,monospace}
  .canvas-docs .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}
  .canvas-docs .thumb{display:grid;place-items:center;height:90px;background:rgba(127,127,127,.1);border-radius:8px}
  .canvas-docs .thumb svg{max-width:70%;max-height:70%}
  .canvas-docs figcaption{font:11px ui-monospace,monospace;opacity:.7;overflow-wrap:anywhere}
  .canvas-docs .hint{opacity:.7;font-size:13px}
  .canvas-error{font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap;padding:20px;color:#b3261e;background:#fff5f5}
</style>`;

function inlineSafe(code: string): string {
  return code.replace(/<\/script/gi, "<\\/script");
}

function needsTailwindCdn(files: CanvasFile[]): boolean {
  return files.some(
    (f) => f.path.endsWith(".css") && /@tailwind|@apply/.test(f.content),
  );
}

/** HTML dokument pre bundlovaný JS modul. */
export function moduleDocument(code: string, files: CanvasFile[]): string {
  const tailwind = needsTailwindCdn(files)
    ? '<script src="https://cdn.tailwindcss.com"></script>'
    : "";
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${BASE_STYLE}${tailwind}${BRIDGE}</head>
<body><div id="root"></div><div id="app"></div>
<script type="module">${inlineSafe(code)}</script></body></html>`;
}

/** HTML dokument pre statickú stránku: lokálne <script>/<link> nahradíme obsahom. */
export function staticDocument(files: CanvasFile[], htmlPath: string): string {
  const html = files.find((f) => f.path === htmlPath)?.content ?? "";
  const dir = htmlPath.split("/").slice(0, -1).join("/");
  const find = (src: string) => {
    const clean = src.replace(/^\.?\//, "").split("?")[0]!;
    return (
      files.find((f) => f.path === clean) ??
      files.find((f) => f.path === (dir ? `${dir}/${clean}` : clean)) ??
      files.find((f) => f.path.endsWith(`/${clean}`))
    );
  };

  let out = html
    .replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (tag, href: string) => {
      if (/^https?:/.test(href) || !/\.css(\?|$)/.test(href)) return tag;
      const file = find(href);
      return file ? `<style>${file.content}</style>` : tag;
    })
    .replace(
      /<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
      (tag, pre: string, src: string, post: string) => {
        if (/^https?:/.test(src)) return tag;
        const file = find(src);
        if (!file) return tag;
        const isModule = /type=["']module["']/.test(pre + post);
        return `<script${isModule ? ' type="module"' : ""}>${inlineSafe(file.content)}</script>`;
      },
    );

  const injection = `${BASE_STYLE}${BRIDGE}`;
  out = /<head[^>]*>/i.test(out)
    ? out.replace(/<head[^>]*>/i, (m) => `${m}${injection}`)
    : `<!doctype html><html><head><meta charset="utf-8">${injection}</head><body>${out}</body></html>`;
  return out;
}

/** Dokumentový režim / chybová stránka. */
export function docsDocument(inner: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">${BASE_STYLE}${BRIDGE}</head>
<body><div class="canvas-docs">${inner}</div></body></html>`;
}

export function errorDocument(messages: string[]): string {
  const body = messages.map((m) => m.replace(/</g, "&lt;")).join("\n\n");
  return `<!doctype html><html><head><meta charset="utf-8">${BASE_STYLE}</head>
<body><div class="canvas-error"><strong>Build zlyhal</strong>\n\n${body}</div></body></html>`;
}
