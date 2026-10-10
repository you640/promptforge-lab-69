import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AiChangeResult } from "./canvas-ai-contract";
export type { AiChangeResult } from "./canvas-ai-contract";

const inputSchema = z.object({
  prompt: z.string().min(3).max(8000),
  files: z
    .array(z.object({ path: z.string().min(1), content: z.string().max(120_000) }))
    .min(1)
    .max(300)
    .refine((fs) => fs.reduce((n, f) => n + f.content.length, 0) <= 650_000, "Projekt je príliš veľký"),
  omitted: z.array(z.string()).max(2000).default([]),
  priorityPaths: z.array(z.string()).max(300).default([]),
});

export const proposeCanvasChanges = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AiChangeResult> => {
    const { generateCanvasChanges } = await import("./canvas-ai.server");
    return generateCanvasChanges(data);
  });
