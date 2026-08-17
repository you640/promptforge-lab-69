import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const fileSchema = z.object({ path: z.string().min(1).max(400), content: z.string() });

export const listCanvasProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("canvas_projects")
      .select("id, name, file_count, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCanvasProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ name: z.string().min(1).max(120), files: z.array(fileSchema).max(300) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: project, error } = await supabase
      .from("canvas_projects")
      .insert({ user_id: userId, name: data.name, file_count: data.files.length })
      .select("id, name, file_count, created_at, updated_at")
      .single();
    if (error || !project) throw new Error(error?.message ?? "Projekt sa nepodarilo vytvoriť");

    if (data.files.length > 0) {
      const rows = data.files.map((f) => ({
        project_id: project.id,
        user_id: userId,
        path: f.path,
        content: f.content,
      }));
      const { error: filesError } = await supabase.from("canvas_files").insert(rows);
      if (filesError) throw new Error(filesError.message);
    }

    const { error: versionError } = await supabase.from("canvas_versions").insert({
      project_id: project.id,
      user_id: userId,
      version: 1,
      prompt: "Import ZIP",
      files: data.files,
    });
    if (versionError) throw new Error(versionError.message);

    return project;
  });

export const getCanvasProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [projectRes, filesRes, versionsRes] = await Promise.all([
      supabase
        .from("canvas_projects")
        .select("id, name, file_count, created_at, updated_at")
        .eq("id", data.projectId)
        .maybeSingle(),
      supabase
        .from("canvas_files")
        .select("path, content")
        .eq("project_id", data.projectId)
        .order("path"),
      supabase
        .from("canvas_versions")
        .select("id, version, prompt, audit_score, created_at, files")
        .eq("project_id", data.projectId)
        .order("version", { ascending: false }),
    ]);
    if (projectRes.error) throw new Error(projectRes.error.message);
    if (!projectRes.data) throw new Error("Projekt sa nenašiel");
    if (filesRes.error) throw new Error(filesRes.error.message);
    if (versionsRes.error) throw new Error(versionsRes.error.message);

    return {
      project: projectRes.data,
      files: filesRes.data ?? [],
      versions: versionsRes.data ?? [],
    };
  });

export const deleteCanvasProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("canvas_projects")
      .delete()
      .eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCanvasFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ projectId: z.string().uuid(), path: z.string().min(1), content: z.string() }).parse(
      input,
    ),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("canvas_files").upsert(
      {
        project_id: data.projectId,
        user_id: context.userId,
        path: data.path,
        content: data.content,
      },
      { onConflict: "project_id,path" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Uloží prijaté zmeny ako novú verziu a prepíše aktuálne súbory. */
export const commitCanvasVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        projectId: z.string().uuid(),
        prompt: z.string().max(8000).default(""),
        auditScore: z.number().int().min(0).max(100).nullable().default(null),
        files: z.array(fileSchema).max(300),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: last, error: lastError } = await supabase
      .from("canvas_versions")
      .select("version")
      .eq("project_id", data.projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw new Error(lastError.message);

    const nextVersion = (last?.version ?? 0) + 1;
    const { data: version, error } = await supabase
      .from("canvas_versions")
      .insert({
        project_id: data.projectId,
        user_id: userId,
        version: nextVersion,
        prompt: data.prompt,
        audit_score: data.auditScore,
        files: data.files,
      })
      .select("id, version, prompt, audit_score, created_at, files")
      .single();
    if (error || !version) throw new Error(error?.message ?? "Verziu sa nepodarilo uložiť");

    await supabase.from("canvas_files").delete().eq("project_id", data.projectId);
    if (data.files.length > 0) {
      const { error: insertError } = await supabase.from("canvas_files").insert(
        data.files.map((f) => ({
          project_id: data.projectId,
          user_id: userId,
          path: f.path,
          content: f.content,
        })),
      );
      if (insertError) throw new Error(insertError.message);
    }
    await supabase
      .from("canvas_projects")
      .update({ file_count: data.files.length })
      .eq("id", data.projectId);

    return version;
  });

export const logCanvasPromptRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        projectId: z.string().uuid(),
        prompt: z.string().max(8000),
        kind: z.enum(["audit", "change"]),
        result: z.unknown(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("canvas_prompt_runs").insert({
      project_id: data.projectId,
      user_id: context.userId,
      prompt: data.prompt,
      kind: data.kind,
      result: (data.result ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
