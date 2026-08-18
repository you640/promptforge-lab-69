import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CRITERION_IDS = [
  "specification",
  "technical",
  "uxui",
  "performance",
  "testing",
  "deployment",
  "creativity",
] as const;

const inputSchema = z.object({
  prompt: z.string().min(20).max(12000),
});

const reviewSchema = z.object({
  total: z.number(),
  verdict: z.string(),
  scores: z.array(
    z.object({
      id: z.enum(CRITERION_IDS),
      score: z.number(),
      finding: z.string(),
      fix: z.string(),
    }),
  ),
  risks: z.array(z.string()),
  rewritten: z.string(),
});

export type AiPromptReview = z.infer<typeof reviewSchema>;

export const reviewPromptWithAi = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AiPromptReview> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI nie je nakonfigurované");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Si expertný auditor promptov pre PWA aplikácie. Hodnotíš prompt podľa 7 kritérií: " +
              "specification (špecifikácia a rozsah), technical (technická presnosť, stack, bezpečnosť), " +
              "uxui (UX/UI a prístupnosť), performance (výkon a Core Web Vitals), testing (testovanie), " +
              "deployment (nasadenie, CI/CD, service worker), creativity (kreativita a odlíšenie). " +
              "Každému daj skóre 0–100 podľa toho, čo prompt reálne obsahuje (nebuď mierny), " +
              "napíš konkrétny nález (finding) a konkrétnu opravu (fix) — nie všeobecné frázy. " +
              "Do 'risks' dopĺň najväčšie riziká, ak sa prompt použije tak ako je. " +
              "Do 'rewritten' napíš kompletne prepísaný, výrazne lepší prompt pripravený na použitie, " +
              "so zachovaním pôvodného zámeru. 'total' je vážený celkový odhad 0–100. " +
              "Odpovedaj po slovensky.",
          },
          { role: "user", content: `PROMPT NA AUDIT:\n${data.prompt}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "prompt_review",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                total: { type: "number" },
                verdict: { type: "string" },
                scores: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string", enum: [...CRITERION_IDS] },
                      score: { type: "number" },
                      finding: { type: "string" },
                      fix: { type: "string" },
                    },
                    required: ["id", "score", "finding", "fix"],
                  },
                },
                risks: { type: "array", items: { type: "string" } },
                rewritten: { type: "string" },
              },
              required: ["total", "verdict", "scores", "risks", "rewritten"],
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI je preťažené, skús to za chvíľu.");
      if (res.status === 402)
        throw new Error("Vyčerpané AI kredity — doplň ich v nastaveniach workspace.");
      throw new Error(`AI chyba (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI nevrátila hodnotenie");
    return reviewSchema.parse(JSON.parse(content));
  });
