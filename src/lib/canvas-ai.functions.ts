import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  prompt: z.string().min(3).max(8000),
  files: z
    .array(z.object({ path: z.string().min(1), content: z.string().max(60_000) }))
    .min(1)
    .max(300)
    .refine((fs) => fs.reduce((n, f) => n + f.content.length, 0) <= 650_000, "Projekt je príliš veľký"),
  omitted: z.array(z.string()).max(2000).default([]),
});

export interface AiChangeResult {
  summary: string;
  changes: { path: string; newContent: string; reason: string }[];
}

export const proposeCanvasChanges = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AiChangeResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI nie je nakonfigurované");

    const context = data.files
      .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
      .join("\n\n");
    const map = data.omitted.length
      ? `\n\nĎALŠIE SÚBORY V PROJEKTE (obsah neposlaný):\n${data.omitted.join("\n")}`
      : "";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "Si senior frontend developer. Dostaneš prompt používateľa a celý projekt (všetky súbory, ktoré sa zmestili). " +
              "Pochop štruktúru projektu, importy a štýly a navrhni zmeny, ktoré na seba nadväzujú a projekt sa po nich spustí. " +
              "Vráť konkrétne úpravy súborov. Pre každý zmenený súbor vráť CELÝ nový obsah súboru, nie diff. " +
              "Meň len súbory, ktoré je nutné zmeniť. Nové súbory môžeš pridať. Odpovedaj po slovensky v poli summary a reason.",
          },
          { role: "user", content: `PROMPT:\n${data.prompt}\n\nSÚBORY PROJEKTU:\n${context}${map}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "canvas_changes",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                changes: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      path: { type: "string" },
                      newContent: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["path", "newContent", "reason"],
                  },
                },
              },
              required: ["summary", "changes"],
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI je momentálne preťažené, skús to za chvíľu.");
      if (res.status === 402)
        throw new Error("Vyčerpané AI kredity — doplň ich v nastaveniach workspace.");
      throw new Error(`AI chyba (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI nevrátila žiadny návrh zmien");

    const parsed = z
      .object({
        summary: z.string(),
        changes: z.array(
          z.object({ path: z.string(), newContent: z.string(), reason: z.string() }),
        ),
      })
      .parse(JSON.parse(content));

    return parsed;
  });
