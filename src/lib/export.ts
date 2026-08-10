import jsPDF from "jspdf";
import Papa from "papaparse";
import { CRITERIA, type AnalysisResult } from "./criteria";
import type { HistoryEntry } from "./storage";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAnalysisPdf(title: string, prompt: string, result: AnalysisResult) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  doc.setFontSize(20);
  doc.text("Auditor Promptov pre PWA", margin, y);
  y += 24;
  doc.setFontSize(12);
  doc.text(`Prompt: ${title || "Bez nazvu"}`, margin, y);
  y += 18;
  doc.text(`Celkove skore: ${result.total}/100 (${result.grade})`, margin, y);
  y += 18;
  doc.text(`Slov: ${result.words} | Znakov: ${result.chars}`, margin, y);
  y += 26;

  doc.setFontSize(14);
  doc.text("Kriteria", margin, y);
  y += 18;
  doc.setFontSize(11);
  result.scores.forEach((s) => {
    const c = CRITERIA.find((x) => x.id === s.id)!;
    doc.text(`${c.name}: ${s.score}/100`, margin, y);
    y += 16;
  });

  y += 12;
  doc.setFontSize(14);
  doc.text("Navrhy na zlepsenie", margin, y);
  y += 18;
  doc.setFontSize(11);
  result.suggestions.forEach((s) => {
    doc.splitTextToSize(`- ${s}`, 500).forEach((line: string) => {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 15;
    });
  });

  doc.addPage();
  y = margin;
  doc.setFontSize(14);
  doc.text("Analyzovany prompt", margin, y);
  y += 20;
  doc.setFontSize(10);
  doc.splitTextToSize(prompt, 500).forEach((line: string) => {
    if (y > 790) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 13;
  });

  doc.save(`audit-promptu-${Date.now()}.pdf`);
}

export function exportHistoryCsv(entries: HistoryEntry[]) {
  const rows = entries.map((e) => {
    const base: Record<string, string | number> = {
      nazov: e.title,
      skore: e.total,
      znamka: e.grade,
      datum: new Date(e.createdAt).toLocaleString("sk-SK"),
    };
    e.scores.forEach((s) => {
      base[s.id] = s.score;
    });
    return base;
  });
  download(
    new Blob([Papa.unparse(rows)], { type: "text/csv;charset=utf-8;" }),
    `historia-auditov-${Date.now()}.csv`,
  );
}

export function exportJson(data: unknown, name: string) {
  download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), name);
}
