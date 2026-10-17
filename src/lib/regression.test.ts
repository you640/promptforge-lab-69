import { describe, expect, it } from "vitest";
import { analyzePrompt, improvePrompt, scoreColor } from "./criteria";
import { isSkippedPath, isTextFile, normalizePath, stripCommonRoot } from "./canvas-types";
import { renderMarkdown, renderDocsPreview } from "./preview/docs-render";
import { esmUrl, readDependencies, splitSpecifier } from "./preview/resolve";
import { componentEntryFile, findComponents, findHtml, planPreview } from "./preview/mode";
import {
  docsDocument,
  errorDocument,
  localScriptPaths,
  moduleDocument,
  staticDocument,
} from "./preview/html";

describe("core regression coverage", () => {
  it("analyses empty and complete prompts deterministically", () => {
    const empty = analyzePrompt("");
    expect(empty).toMatchObject({ total: 0, grade: "F", words: 0, chars: 0 });
    const result = analyzePrompt(
      "React TypeScript aplikácia pre používateľov: layout, API, test, performance, mobil, WCAG, deploy",
    );
    expect(result.words).toBe(12);
    expect(result.chars).toBeGreaterThan(0);
    expect(result.scores).toHaveLength(7);
    expect(result.suggestions).toHaveLength(4);
  });

  it("improves prompts and maps score colors", () => {
    const result = analyzePrompt("jednoduchý prompt");
    expect(improvePrompt("jednoduchý prompt", result)).toContain("Akceptačné kritériá");
    expect(scoreColor(80)).toBe("text-success");
    expect(scoreColor(55)).toBe("text-warning");
    expect(scoreColor(54)).toBe("text-destructive");
  });

  it("normalizes and filters canvas paths safely", () => {
    expect(normalizePath("/src/App.tsx")).toBe("src/App.tsx");
    expect(isSkippedPath("node_modules/react/index.js")).toBe(true);
    expect(isSkippedPath("src/.env.example")).toBe(true);
    expect(isSkippedPath("src/App.tsx")).toBe(false);
    expect(isTextFile("src/App.tsx")).toBe(true);
    expect(isTextFile("public/photo.png")).toBe(false);
    expect(
      stripCommonRoot([
        { path: "project/a.ts", content: "a" },
        { path: "project/b.ts", content: "b" },
      ]),
    ).toEqual([
      { path: "a.ts", content: "a" },
      { path: "b.ts", content: "b" },
    ]);
  });

  it("resolves package dependencies and esm URLs", () => {
    const files = [
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: { react: "^19.1.0", "@tanstack/react-router": "1.2.3" },
          devDependencies: { vite: "^8" },
        }),
      },
    ];
    expect(readDependencies(files)).toEqual({
      vite: "^8",
      react: "^19.1.0",
      "@tanstack/react-router": "1.2.3",
    });
    expect(splitSpecifier("@tanstack/react-router/link")).toEqual({
      name: "@tanstack/react-router",
      sub: "link",
    });
    expect(esmUrl("@tanstack/react-router/link", readDependencies(files))).toContain(
      "@tanstack/react-router@1.2.3/link?deps=react@19.1.0",
    );
  });

  it("plans every supported preview fallback", () => {
    const react = [{ path: "src/main.tsx", content: "export default function App() {}" }];
    const html = [{ path: "index.html", content: "<main />" }];
    const component = [{ path: "src/Card.tsx", content: "export function Card() {}" }];
    expect(planPreview(react).mode).toBe("react");
    expect(planPreview(html).mode).toBe("html");
    expect(planPreview(component).mode).toBe("component");
    expect(planPreview([{ path: "README.md", content: "# docs" }]).mode).toBe("docs");
    expect(planPreview([]).mode).toBe("none");
    expect(findHtml(html)).toBe("index.html");
    expect(findComponents(component)).toEqual(["src/Card.tsx"]);
    expect(componentEntryFile("src/Card.tsx").content).toContain('from "/src/Card.tsx"');
  });

  it("renders markdown and escapes unsafe content", () => {
    const rendered = renderMarkdown("# Title\n\n- one\n- **two**\n\n<script>alert(1)</script>");
    expect(rendered).toContain("<h1>Title</h1>");
    expect(rendered).toContain("<ul>");
    expect(rendered).toContain("&lt;script&gt;");
    expect(renderDocsPreview([{ path: "README.md", content: "# Readme" }])).toContain("Readme");
  });

  it("builds safe preview documents and resolves local scripts", () => {
    const files = [
      {
        path: "index.html",
        content:
          '<head><link href="style.css"></head><script src="app.js"></script><script src="https://cdn.test/x.js"></script>',
      },
      { path: "style.css", content: "body { color: red }" },
      { path: "app.js", content: "document.body.dataset.ready = 'yes';" },
    ];
    expect(localScriptPaths(files, "index.html")).toEqual(["app.js"]);
    expect(staticDocument(files, "index.html")).toContain("<style>body { color: red }</style>");
    expect(moduleDocument("</script>", [])).toContain("<\\/script>");
    expect(docsDocument("<p>docs</p>")).toContain("canvas-docs");
    expect(errorDocument(["<broken>"])).toContain("&lt;broken>");
  });
});
