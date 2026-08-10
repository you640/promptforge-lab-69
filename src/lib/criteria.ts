export type CriterionId =
  | "specification"
  | "technical"
  | "uxui"
  | "performance"
  | "testing"
  | "deployment"
  | "creativity";

export interface Criterion {
  id: CriterionId;
  name: string;
  short: string;
  description: string;
  weight: number;
  keywords: string[];
  checklist: string[];
  tip: string;
}

export const CRITERIA: Criterion[] = [
  {
    id: "specification",
    name: "Špecifikácia",
    short: "Spec",
    description:
      "Jasnosť cieľa, cieľová skupina, rozsah funkcií, dátový model a akceptačné kritériá.",
    weight: 1.2,
    keywords: [
      "cieľ",
      "ciel",
      "používateľ",
      "pouzivatel",
      "sekcie",
      "funkcie",
      "požiadavky",
      "poziadavky",
      "rozsah",
      "výstup",
      "vystup",
      "goal",
      "scope",
      "requirements",
      "user",
    ],
    checklist: [
      "Prompt definuje jednu jasnú hlavnú úlohu",
      "Je uvedená cieľová skupina a hlavný use-case",
      "Sú vymenované konkrétne sekcie / obrazovky",
      "Je popísaný dátový model alebo entity",
      "Existujú akceptačné kritériá („hotovo, keď…“)",
    ],
    tip: "Doplň merateľné akceptačné kritériá a vymenuj obrazovky menom.",
  },
  {
    id: "technical",
    name: "Technická presnosť",
    short: "Tech",
    description: "Konkrétny stack, verzie, architektúra, API a bezpečnosť.",
    weight: 1.15,
    keywords: [
      "react",
      "typescript",
      "vite",
      "tailwind",
      "workbox",
      "supabase",
      "firebase",
      "api",
      "jwt",
      "oauth",
      "service worker",
      "manifest",
      "rls",
      "schema",
    ],
    checklist: [
      "Je určený framework a jazyk (napr. React + TypeScript)",
      "Je určený build tool a styling",
      "Je popísaná autentifikácia a autorizácia",
      "Sú uvedené integrácie / API",
      "Sú spomenuté bezpečnostné pravidlá (RLS, validácia)",
    ],
    tip: "Uveď verzie knižníc a explicitne popíš dátové kontrakty API.",
  },
  {
    id: "uxui",
    name: "UX / UI",
    short: "UX",
    description: "Vizuálny jazyk, dizajn systém, responzivita a prístupnosť.",
    weight: 1.1,
    keywords: [
      "dizajn",
      "design",
      "farb",
      "paleta",
      "responz",
      "mobil",
      "layout",
      "typograf",
      "accessib",
      "prístupnost",
      "pristupnost",
      "wcag",
      "kontrast",
      "dark",
      "komponent",
    ],
    checklist: [
      "Je definovaná farebná paleta alebo tokeny",
      "Je určená typografia",
      "Je uvedená responzivita (mobil / desktop)",
      "Sú spomenuté stavy komponentov (hover, loading, empty)",
      "Je riešená prístupnosť (kontrast, klávesnica, ARIA)",
    ],
    tip: "Pridaj konkrétne HEX tokeny, typografiu a požiadavku WCAG AA.",
  },
  {
    id: "performance",
    name: "Výkon",
    short: "Perf",
    description: "Rýchlosť načítania, cachovanie, lazy loading a metriky.",
    weight: 1,
    keywords: [
      "výkon",
      "vykon",
      "performance",
      "lighthouse",
      "cache",
      "cachov",
      "lazy",
      "offline",
      "bundle",
      "lcp",
      "cls",
      "optimaliz",
      "web vitals",
    ],
    checklist: [
      "Sú uvedené cieľové metriky (Lighthouse, Web Vitals)",
      "Je popísaná cache strategia",
      "Je spomenutý lazy loading / code splitting",
      "Je riešená optimalizácia obrázkov",
      "Je definovaný offline režim",
    ],
    tip: "Nastav číselné cieľe, napr. LCP < 2.5 s a Lighthouse ≥ 90.",
  },
  {
    id: "testing",
    name: "Testovanie",
    short: "Test",
    description: "Unit, integračné a E2E testy, pokrytie a QA scenáre.",
    weight: 1,
    keywords: [
      "test",
      "vitest",
      "jest",
      "playwright",
      "cypress",
      "pokrytie",
      "coverage",
      "e2e",
      "qa",
      "lint",
      "typecheck",
    ],
    checklist: [
      "Je uvedený testovací framework",
      "Sú definované E2E scenáre",
      "Je určené cieľové pokrytie",
      "Je spomenutý lint / typecheck",
      "Sú popísané edge-case scenáre",
    ],
    tip: "Vymenuj kritické user flows, ktoré musia mať E2E test.",
  },
  {
    id: "deployment",
    name: "Nasadenie",
    short: "Deploy",
    description: "CI/CD, prostredia, monitoring a release proces.",
    weight: 0.95,
    keywords: [
      "nasaden",
      "deploy",
      "ci",
      "cd",
      "netlify",
      "vercel",
      "github actions",
      "docker",
      "monitoring",
      "env",
      "release",
      "hosting",
    ],
    checklist: [
      "Je určený hosting / platforma",
      "Je popísaná CI/CD pipeline",
      "Sú definované prostredia (dev / prod)",
      "Je riešená správa env premenných",
      "Je spomenutý monitoring a logovanie",
    ],
    tip: "Doplň kroky pipeline: install → lint → test → build → deploy.",
  },
  {
    id: "creativity",
    name: "Kreativita",
    short: "Idea",
    description: "Originalita, diferenciácia a pridaná hodnota riešenia.",
    weight: 0.85,
    keywords: [
      "originál",
      "original",
      "unikát",
      "unikat",
      "inovat",
      "kreativ",
      "animác",
      "animac",
      "micro",
      "gamifik",
      "inšpir",
      "inspir",
      "moodboard",
      "štýl",
      "styl",
    ],
    checklist: [
      "Prompt uvádza referencie alebo inšpiráciu",
      "Je popísaný unikátny prvok produktu",
      "Sú spomenuté mikro-interakcie alebo animácie",
      "Je definovaný tón komunikácie",
      "Je jasná pridaná hodnota pre používateľa",
    ],
    tip: "Popíš jeden nezameniteľný „wow“ prvok a referenčný vizuálny štýl.",
  },
];

export interface CriterionScore {
  id: CriterionId;
  score: number;
  matched: string[];
  missing: string[];
}

export interface AnalysisResult {
  total: number;
  grade: string;
  words: number;
  chars: number;
  scores: CriterionScore[];
  suggestions: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function analyzePrompt(prompt: string): AnalysisResult {
  const text = norm(prompt);
  const words = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const lengthBonus = Math.min(20, Math.round(words / 12));
  const structureBonus =
    (/\n\s*[-*•\d]/.test(prompt) ? 8 : 0) + (/:/.test(prompt) ? 4 : 0);

  const scores: CriterionScore[] = CRITERIA.map((c) => {
    const matched = c.keywords.filter((k) => text.includes(norm(k)));
    const coverage = Math.min(1, matched.length / 4);
    const raw = coverage * 68 + lengthBonus + structureBonus;
    const score = words === 0 ? 0 : Math.max(0, Math.min(100, Math.round(raw)));
    const missing = score >= 80 ? [] : c.checklist.slice(matched.length >= 3 ? 3 : matched.length);
    return { id: c.id, score, matched, missing };
  });

  const weightSum = CRITERIA.reduce((a, c) => a + c.weight, 0);
  const total = Math.round(
    scores.reduce((a, s) => {
      const w = CRITERIA.find((c) => c.id === s.id)!.weight;
      return a + s.score * w;
    }, 0) / weightSum,
  );

  const grade =
    total >= 90 ? "A" : total >= 75 ? "B" : total >= 60 ? "C" : total >= 40 ? "D" : "F";

  const suggestions = scores
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((s) => {
      const c = CRITERIA.find((x) => x.id === s.id)!;
      return `${c.name}: ${c.tip}`;
    });

  return { total, grade, words, chars: prompt.length, scores, suggestions };
}

export function improvePrompt(prompt: string, result: AnalysisResult): string {
  const weak = result.scores.filter((s) => s.score < 80);
  const sections = weak.map((s) => {
    const c = CRITERIA.find((x) => x.id === s.id)!;
    return `### ${c.name}\n${c.checklist.map((i) => `- ${i}`).join("\n")}`;
  });
  return [
    prompt.trim(),
    "",
    "---",
    "## Doplnené požiadavky (auto-návrh)",
    ...sections,
    "",
    "## Akceptačné kritériá",
    "- Lighthouse PWA ≥ 90, Performance ≥ 90",
    "- Aplikácia funguje offline a je inštalovateľná",
    "- Responzívna od 360 px do 1920 px, WCAG AA kontrast",
  ].join("\n");
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 55) return "text-warning";
  return "text-destructive";
}
