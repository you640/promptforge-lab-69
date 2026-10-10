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
    expect(ctx.files[0]!.path).toBe("z.ts");
  });
});
