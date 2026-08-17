import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FolderUp,
  History,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTree } from "@/components/canvas/FileTree";
import { DiffView } from "@/components/canvas/DiffView";
import { analyzePrompt, CRITERIA, type AnalysisResult } from "@/lib/criteria";
import { exportZip, importZip } from "@/lib/canvas-zip";
import {
  AI_CONTEXT_CHARS,
  AI_CONTEXT_FILES,
  type CanvasFile,
  type CanvasVersion,
  type ProposedChange,
} from "@/lib/canvas-types";
import {
  commitCanvasVersion,
  createCanvasProject,
  deleteCanvasProject,
  getCanvasProject,
  listCanvasProjects,
  logCanvasPromptRun,
  saveCanvasFile,
} from "@/lib/canvas.functions";
import { proposeCanvasChanges } from "@/lib/canvas-ai.functions";

const LivePreview = lazy(() => import("@/components/canvas/LivePreview"));

export const Route = createFileRoute("/_authenticated/canvas")({
  head: () => ({
    meta: [
      { title: "Canvas — vyskúšaj prompty na vlastnom projekte" },
      {
        name: "description",
        content:
          "Nahraj ZIP svojho projektu, prezeraj a uprav súbory, spusti živý náhľad a nechaj AI navrhnúť zmeny podľa promptu — bez zásahu do reálneho repozitára.",
      },
      { property: "og:title", content: "Canvas: prompty na vlastnom projekte" },
      {
        property: "og:description",
        content:
          "ZIP import, živý náhľad, audit promptu podľa 7 kritérií a AI návrhy zmien s diffom a verziami.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CanvasPage,
});

function CanvasPage() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const listFn = useServerFn(listCanvasProjects);
  const getFn = useServerFn(getCanvasProject);
  const createFn = useServerFn(createCanvasProject);
  const deleteFn = useServerFn(deleteCanvasProject);
  const saveFileFn = useServerFn(saveCanvasFile);
  const commitFn = useServerFn(commitCanvasVersion);
  const logRunFn = useServerFn(logCanvasPromptRun);
  const proposeFn = useServerFn(proposeCanvasChanges);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<CanvasFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [contextPaths, setContextPaths] = useState<string[]>([]);
  const [dirty, setDirty] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [audit, setAudit] = useState<AnalysisResult | null>(null);
  const [changes, setChanges] = useState<ProposedChange[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [importing, setImporting] = useState(false);

  const projects = useQuery({ queryKey: ["canvas-projects"], queryFn: () => listFn({}) });

  const detail = useQuery({
    queryKey: ["canvas-project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await getFn({ data: { projectId: projectId! } });
      setFiles(res.files);
      setActivePath(res.files[0]?.path ?? null);
      setContextPaths(res.files.slice(0, 4).map((f) => f.path));
      setDirty([]);
      return res;
    },
  });

  const versions = (detail.data?.versions ?? []) as unknown as CanvasVersion[];
  const activeFile = files.find((f) => f.path === activePath) ?? null;

  const contextFiles = useMemo(
    () =>
      files
        .filter((f) => contextPaths.includes(f.path))
        .slice(0, AI_CONTEXT_FILES)
        .map((f) => ({ path: f.path, content: f.content.slice(0, AI_CONTEXT_CHARS) })),
    [files, contextPaths],
  );

  const onImport = async (file: File) => {
    setImporting(true);
    try {
      const { files: imported, skipped } = await importZip(file);
      if (imported.length === 0) throw new Error("V ZIP-e sa nenašli žiadne textové súbory");
      const project = await createFn({
        data: { name: file.name.replace(/\.zip$/i, ""), files: imported },
      });
      await queryClient.invalidateQueries({ queryKey: ["canvas-projects"] });
      setProjectId(project.id);
      toast.success(
        `Načítaných ${imported.length} súborov${skipped > 0 ? `, ${skipped} preskočených` : ""}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import ZIP sa nepodaril");
    } finally {
      setImporting(false);
    }
  };

  const updateActive = (content: string) => {
    if (!activePath) return;
    setFiles((prev) => prev.map((f) => (f.path === activePath ? { ...f, content } : f)));
    setDirty((prev) => (prev.includes(activePath) ? prev : [...prev, activePath]));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !activeFile) return;
      await saveFileFn({
        data: { projectId, path: activeFile.path, content: activeFile.content },
      });
    },
    onSuccess: () => {
      setDirty((prev) => prev.filter((p) => p !== activePath));
      toast.success("Súbor uložený");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Uloženie sa nepodarilo"),
  });

  const runAudit = async () => {
    const result = analyzePrompt(prompt);
    setAudit(result);
    if (projectId) {
      await logRunFn({
        data: { projectId, prompt, kind: "audit", result: { total: result.total, grade: result.grade } },
      }).catch(() => undefined);
    }
  };

  const proposeMutation = useMutation({
    mutationFn: async () => {
      if (contextFiles.length === 0) throw new Error("Vyber aspoň jeden súbor do kontextu");
      return proposeFn({ data: { prompt, files: contextFiles } });
    },
    onSuccess: async (res) => {
      setChanges(res.changes);
      setAiSummary(res.summary);
      if (res.changes.length === 0) toast.info("AI nenavrhla žiadne zmeny");
      if (projectId) {
        await logRunFn({
          data: { projectId, prompt, kind: "change", result: res },
        }).catch(() => undefined);
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "AI návrh sa nepodaril"),
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Najprv nahraj projekt");
      const next = [...files];
      for (const change of changes) {
        const index = next.findIndex((f) => f.path === change.path);
        if (index >= 0) next[index] = { path: change.path, content: change.newContent };
        else next.push({ path: change.path, content: change.newContent });
      }
      next.sort((a, b) => a.path.localeCompare(b.path));
      await commitFn({
        data: { projectId, prompt, auditScore: audit?.total ?? null, files: next },
      });
      return next;
    },
    onSuccess: async (next) => {
      setFiles(next);
      setChanges([]);
      setDirty([]);
      await queryClient.invalidateQueries({ queryKey: ["canvas-project", projectId] });
      toast.success("Zmeny prijaté a uložené ako nová verzia");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Uloženie zlyhalo"),
  });

  const rollbackMutation = useMutation({
    mutationFn: async (version: CanvasVersion) => {
      if (!projectId) return [] as CanvasFile[];
      await commitFn({
        data: {
          projectId,
          prompt: `Návrat na verziu ${version.version}`,
          auditScore: version.audit_score,
          files: version.files,
        },
      });
      return version.files;
    },
    onSuccess: async (restored) => {
      setFiles(restored);
      await queryClient.invalidateQueries({ queryKey: ["canvas-project", projectId] });
      toast.success("Verzia obnovená");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Obnova zlyhala"),
  });

  return (
    <AppShell
      title="Canvas"
      subtitle="Nahraj ZIP projektu, skúšaj prompty a uvidíš dopad bez zásahu do reálneho repozitára"
    >
      <div className="surface-card mb-6 flex flex-wrap items-center gap-3 p-5">
        <input
          ref={fileInput}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImport(file);
            e.target.value = "";
          }}
        />
        <Button onClick={() => fileInput.current?.click()} disabled={importing}>
          {importing ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1 h-4 w-4" />
          )}
          Nahrať ZIP
        </Button>

        <select
          value={projectId ?? ""}
          onChange={(e) => setProjectId(e.target.value || null)}
          className="h-9 min-w-[200px] rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Vybrať projekt"
        >
          <option value="">— vyber projekt —</option>
          {(projects.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.file_count})
            </option>
          ))}
        </select>

        {projectId && (
          <>
            <Button
              variant="outline"
              onClick={() => void exportZip(detail.data?.project.name ?? "canvas", files)}
            >
              <Download className="mr-1 h-4 w-4" /> Export ZIP
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await deleteFn({ data: { projectId } });
                setProjectId(null);
                setFiles([]);
                await queryClient.invalidateQueries({ queryKey: ["canvas-projects"] });
                toast.success("Projekt zmazaný");
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Zmazať
            </Button>
          </>
        )}
      </div>

      {!projectId ? (
        <div className="surface-card grid place-items-center p-12 text-center">
          <FolderUp className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">Začni nahraním ZIP projektu</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Rozbalíme ho priamo v prehliadači (bez <code>node_modules</code> a binárok), zobrazíme
            súbory, spustíme náhľad a prompt vyskúšaš na kópii — tvoj repozitár zostáva nedotknutý.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="surface-card p-4">
            <h3 className="mb-3 text-sm font-semibold">
              Súbory <span className="text-muted-foreground">({files.length})</span>
            </h3>
            <FileTree
              files={files}
              active={activePath}
              changed={dirty}
              selected={contextPaths}
              onSelect={setActivePath}
              onToggleContext={(path) =>
                setContextPaths((prev) =>
                  prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
                )
              }
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Zaškrtnuté súbory idú do kontextu promptu (max {AI_CONTEXT_FILES}).
            </p>
          </div>

          <div className="min-w-0">
            <Tabs defaultValue="editor">
              <TabsList className="mb-4">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Živý náhľad</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="versions">Verzie</TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <div className="surface-card p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {activeFile?.path ?? "—"}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate()}
                      disabled={!activeFile || !dirty.includes(activeFile.path)}
                    >
                      <Save className="mr-1 h-4 w-4" /> Uložiť
                    </Button>
                  </div>
                  <Textarea
                    value={activeFile?.content ?? ""}
                    onChange={(e) => updateActive(e.target.value)}
                    className="min-h-[420px] font-mono text-xs"
                    spellCheck={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <div className="surface-card p-4">
                  <ClientOnly
                    fallback={
                      <div className="grid h-[420px] place-items-center text-sm text-muted-foreground">
                        Náhľad sa pripravuje…
                      </div>
                    }
                  >
                    <Suspense
                      fallback={
                        <div className="grid h-[420px] place-items-center text-sm text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      }
                    >
                      <LivePreview files={files} />
                    </Suspense>
                  </ClientOnly>
                </div>
              </TabsContent>

              <TabsContent value="prompt">
                <div className="surface-card p-4">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Napr.: Prerob hlavičku na sticky, pridaj tmavý režim a zlepši prístupnosť tlačidiel…"
                    className="min-h-[160px] font-mono text-sm"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => void runAudit()} disabled={!prompt.trim()}>
                      <Sparkles className="mr-1 h-4 w-4" /> Audit promptu
                    </Button>
                    <Button
                      onClick={() => proposeMutation.mutate()}
                      disabled={!prompt.trim() || proposeMutation.isPending}
                    >
                      {proposeMutation.isPending ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-1 h-4 w-4" />
                      )}
                      Navrhnúť zmeny
                    </Button>
                  </div>

                  {audit && (
                    <div className="mt-5 rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">Audit promptu</h4>
                        <Badge>
                          {audit.total}/100 · {audit.grade}
                        </Badge>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-xs">
                        {audit.scores.map((s) => (
                          <li key={s.id} className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {CRITERIA.find((c) => c.id === s.id)?.name ?? s.id}
                            </span>
                            <span className="font-semibold tabular-nums">{s.score}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {changes.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground">{aiSummary}</p>
                        <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => setChanges([])}>
                            Zamietnuť
                          </Button>
                          <Button
                            onClick={() => acceptMutation.mutate()}
                            disabled={acceptMutation.isPending}
                          >
                            {acceptMutation.isPending && (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            )}
                            Prijať zmeny ({changes.length})
                          </Button>
                        </div>
                      </div>
                      {changes.map((change) => (
                        <div key={change.path} className="rounded-lg border border-border p-3">
                          <p className="mb-1 font-mono text-xs text-primary">{change.path}</p>
                          <p className="mb-2 text-xs text-muted-foreground">{change.reason}</p>
                          <DiffView
                            before={files.find((f) => f.path === change.path)?.content ?? ""}
                            after={change.newContent}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="versions">
                <div className="surface-card p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <History className="h-4 w-4 text-accent" /> Verzie projektu
                  </h3>
                  <ul className="space-y-2">
                    {versions.map((v) => (
                      <li
                        key={v.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="font-semibold">v{v.version}</span>{" "}
                          <span className="text-muted-foreground">
                            {new Date(v.created_at).toLocaleString("sk-SK")} · {v.files.length}{" "}
                            súborov
                          </span>
                          {v.prompt && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {v.prompt}
                            </span>
                          )}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackMutation.mutate(v)}
                          disabled={rollbackMutation.isPending}
                        >
                          Obnoviť
                        </Button>
                      </li>
                    ))}
                    {versions.length === 0 && (
                      <li className="py-6 text-center text-xs text-muted-foreground">
                        Zatiaľ žiadne verzie
                      </li>
                    )}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </AppShell>
  );
}
