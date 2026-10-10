import { describe, expect, it } from "vitest";
import { canvasProjectMessage, validateCanvasChanges } from "./canvas-ai-contract";

describe("project-wide proposals", () => {
  it("allows style, layout and interactive edits outside checked files", () => {
    const changes = ["src/styles.css", "src/Layout.tsx", "src/components/Menu.tsx"].map((path) => ({ path, newContent: "complete source", reason: "requested change" }));
    expect(validateCanvasChanges({ summary: "done", changes }, []).changes).toEqual(changes);
    const context = JSON.parse(canvasProjectMessage("layout", [{ path: "src/App.tsx", content: "app" }], ["src/Other.tsx"], ["src/App.tsx"]));
    expect(context.projectTree).toEqual(["src/App.tsx", "src/Other.tsx"]);
  });
  it("rejects overwriting unread files", () => {
    expect(() => validateCanvasChanges({ summary: "", changes: [{ path: "src/Other.tsx", newContent: "partial", reason: "" }] }, ["src/Other.tsx"])).toThrow();
  });
  it("rejects duplicate changes instead of applying an ambiguous proposal", () => {
    const change = { path: "src/App.tsx", newContent: "a", reason: "" };
    expect(() => validateCanvasChanges({ summary: "", changes: [change, change] }, [])).toThrow();
  });
  it("rejects paths outside the project", () => {
    expect(() => validateCanvasChanges({ summary: "", changes: [{ path: "../app.tsx", newContent: "a", reason: "" }] }, [])).toThrow();
  });
});