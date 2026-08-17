CREATE TABLE public.canvas_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canvas_projects TO authenticated;
GRANT ALL ON public.canvas_projects TO service_role;
ALTER TABLE public.canvas_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.canvas_projects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.canvas_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);
CREATE INDEX canvas_files_project_idx ON public.canvas_files (project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canvas_files TO authenticated;
GRANT ALL ON public.canvas_files TO service_role;
ALTER TABLE public.canvas_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own files" ON public.canvas_files FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.canvas_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  audit_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, version)
);
CREATE INDEX canvas_versions_project_idx ON public.canvas_versions (project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canvas_versions TO authenticated;
GRANT ALL ON public.canvas_versions TO service_role;
ALTER TABLE public.canvas_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own versions" ON public.canvas_versions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.canvas_prompt_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_id UUID REFERENCES public.canvas_versions(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  kind TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX canvas_prompt_runs_project_idx ON public.canvas_prompt_runs (project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canvas_prompt_runs TO authenticated;
GRANT ALL ON public.canvas_prompt_runs TO service_role;
ALTER TABLE public.canvas_prompt_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs" ON public.canvas_prompt_runs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.canvas_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER canvas_projects_touch BEFORE UPDATE ON public.canvas_projects
  FOR EACH ROW EXECUTE FUNCTION public.canvas_touch_updated_at();
CREATE TRIGGER canvas_files_touch BEFORE UPDATE ON public.canvas_files
  FOR EACH ROW EXECUTE FUNCTION public.canvas_touch_updated_at();