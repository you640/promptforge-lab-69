import { describe, expect, it } from "vitest";
import { buildAiContext } from "./canvas-context";

const f = (path: string, size = 10) => ({ path, content: "x".repeat(size) });

describe("buildAiContext", () => {
  it("sends the whole project when it fits, not just 6 files", () => {
    const files = Array.from({ length: 40 }, (_, i) => f(`src/c${i}.tsx`));
    expect(buildAiContext(files, "zmeň hlavičku").files).toHaveLength(40);
  });

  it("lists files beyond the budget as omitted", () => {
    const ctx = buildAiContext([f("a.ts", 60), f("b.ts", 60)], "test", [], 100);
    expect(ctx.files).toHaveLength(1);
    expect(ctx.omitted).toHaveLength(1);
  });

  it("puts ticked files first", () => {
    const ctx = buildAiContext([f("a.ts", 60), f("z.ts", 60)], "test", ["z.ts"], 100);
    expect(ctx.files[0]?.path).toBe("z.ts");
  });

  it("includes unselected style, layout and interactive files", () => {
    const files = [f("src/App.tsx"), f("src/styles.css"), f("src/components/Menu.tsx"), f("package.json")];
    expect(buildAiContext(files, "Zmeň celý štýl a layout a interaktívne komponenty", ["src/App.tsx"]).files).toEqual(expect.arrayContaining(files));
  });

  it("sends a full 90,000 character file without silent truncation", () => {
    const file = f("src/styles.css", 90_000);
    expect(buildAiContext([file], "štýl").files[0]?.content).toBe(file.content);
  });

  it("prioritizes shared styles over unrelated content for broad edits", () => {
    const ctx = buildAiContext([f("a.txt", 60), f("src/styles.css", 60)], "Zmeň celý štýl stránky", [], 100);
    expect(ctx.files[0]?.path).toBe("src/styles.css");
  });

  it("marks oversize files unread instead of returning truncated contents", () => {
    const ctx = buildAiContext([f("src/App.tsx", 120_001)], "layout");
    expect(ctx.files).toHaveLength(0);
    expect(ctx.omitted).toEqual(["src/App.tsx"]);
  });
});
