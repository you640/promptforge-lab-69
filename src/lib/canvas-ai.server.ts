import { APICallError, NoObjectGeneratedError, Output, streamText } from "ai";
import { createLovableAiGatewayProvider } from "./ai/gateway.server";
import { CANVAS_SYSTEM_PROMPT, canvasChangeSchema, canvasProjectMessage, validateCanvasChanges } from "./canvas-ai-contract";
import type { CanvasFile } from "./canvas-types";

export async function generateCanvasChanges(data: { prompt: string; files: CanvasFile[]; omitted: string[]; priorityPaths: string[] }) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI nie je nakonfigurované");
  const provider = createLovableAiGatewayProvider(key, undefined, { baseURL: "https://ai.gateway.lovable.dev/v1" });
  try {
    const result = streamText({
      model: provider("google/gemini-3.7-flash"),
      system: CANVAS_SYSTEM_PROMPT,
      prompt: canvasProjectMessage(data.prompt, data.files, data.omitted, data.priorityPaths),
      output: Output.object({ schema: canvasChangeSchema }),
      maxRetries: 0,
    });
    let output;
    try {
      output = await result.output;
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error;
      try {
        output = canvasChangeSchema.parse(JSON.parse(error.text ?? ""));
      } catch {
        throw new Error("AI nedokončila platný návrh. Žiadny súbor nebol zmenený.");
      }
    }
    return validateCanvasChanges(output, data.omitted);
  } catch (error) {
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 429) throw new Error("AI je momentálne preťažené, skús to za chvíľu.");
      if (error.statusCode === 402 || error.statusCode === 403) {
        let message = "AI požiadavka bola zablokovaná. Skontroluj kredity a povolenia AI vo workspace.";
        try {
          const body = JSON.parse(error.responseBody ?? "{}");
          message = body.message ?? body.error?.message ?? message;
        } catch { /* Keep the safe default. */ }
        throw new Error(message);
      }
      throw new Error(`AI chyba (${error.statusCode ?? "spojenie"}): ${error.message.slice(0, 200)}`);
    }
    throw error;
  }
}