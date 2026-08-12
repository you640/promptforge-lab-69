import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface LighthouseAudit {
  url: string;
  finalUrl: string;
  strategy: "mobile" | "desktop";
  fetchedAt: string;
  categories: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: { id: string; title: string; display: string }[];
}

const inputSchema = z.object({
  url: z.string().url(),
  strategy: z.enum(["mobile", "desktop"]).default("mobile"),
});

const pct = (v: unknown) => (typeof v === "number" ? Math.round(v * 100) : null);

export const runLighthouseAudit = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<LighthouseAudit> => {
    const apiKey = process.env["PAGESPEED_API_KEY"];
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", data.url);
    endpoint.searchParams.set("strategy", data.strategy);
    for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
      endpoint.searchParams.append("category", c);
    }
    if (apiKey) endpoint.searchParams.set("key", apiKey);

    const res = await fetch(endpoint.toString());
    if (!res.ok) {
      const body = await res.text();
      let message = `Lighthouse audit zlyhal (HTTP ${res.status}).`;
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string } };
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        /* keep default message */
      }
      throw new Error(message);
    }

    const json = (await res.json()) as {
      lighthouseResult?: {
        finalUrl?: string;
        requestedUrl?: string;
        categories?: Record<string, { score?: number }>;
        audits?: Record<string, { title?: string; displayValue?: string }>;
      };
    };
    const lr = json.lighthouseResult ?? {};
    const cats = lr.categories ?? {};
    const audits = lr.audits ?? {};
    const metricIds = [
      "first-contentful-paint",
      "largest-contentful-paint",
      "total-blocking-time",
      "cumulative-layout-shift",
      "speed-index",
    ];

    return {
      url: data.url,
      finalUrl: lr.finalUrl ?? lr.requestedUrl ?? data.url,
      strategy: data.strategy,
      fetchedAt: new Date().toISOString(),
      categories: {
        performance: pct(cats["performance"]?.score),
        accessibility: pct(cats["accessibility"]?.score),
        bestPractices: pct(cats["best-practices"]?.score),
        seo: pct(cats["seo"]?.score),
      },
      metrics: metricIds
        .filter((id) => audits[id]?.displayValue)
        .map((id) => ({
          id,
          title: audits[id]?.title ?? id,
          display: audits[id]?.displayValue ?? "",
        })),
    };
  });
