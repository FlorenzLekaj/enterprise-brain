-- ====================================================================
-- Enterprise Brain — Supabase Schema
-- Run this once in your Supabase SQL Editor (Database → SQL Editor)
-- ====================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ====================================================================
-- TABLES
-- ====================================================================

-- Multi-tenant root: one row per customer company
CREATE TABLE IF NOT EXISTS public.organizations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extends auth.users — links each user to one organization
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID        REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- The knowledge base — one row per uploaded PDF
CREATE TABLE IF NOT EXISTS public.documents (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  content         TEXT        NOT NULL,  -- extracted plain text from PDF
  file_size       INTEGER,               -- original file size in bytes
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ====================================================================
-- INDEXES (performance)
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_documents_org
  ON public.documents(organization_id);

CREATE INDEX IF NOT EXISTS idx_documents_created
  ON public.documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_org
  ON public.profiles(organization_id);


-- ====================================================================
-- ROW LEVEL SECURITY  (the "S" in SaaS isolation)
-- ====================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents     ENABLE ROW LEVEL SECURITY;

-- ── Profiles ────────────────────────────────────────────────────────
CREATE POLICY "profile: owner can select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profile: owner can update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Organizations ───────────────────────────────────────────────────
CREATE POLICY "org: members can select"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ── Documents ───────────────────────────────────────────────────────

-- Members can read all documents in their org
CREATE POLICY "doc: members can select"
  ON public.documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Members can upload documents to their org
CREATE POLICY "doc: members can insert"
  ON public.documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Members can delete only their own uploads
CREATE POLICY "doc: uploader can delete"
  ON public.documents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );


-- ====================================================================
-- TRIGGER: auto-create profile on signup
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists to allow safe re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- INITIAL SETUP INSTRUCTIONS
-- ====================================================================
--
-- 1. Create an organization:
--    INSERT INTO public.organizations (name) VALUES ('Meine Firma GmbH')
--    RETURNING id;
--
-- 2. Assign a user to that organization (after they sign up):
--    UPDATE public.profiles
--    SET organization_id = '<org-id-from-step-1>'
--    WHERE id = '<user-uuid>';
--
-- That's it — RLS handles the rest automatically.
-- ====================================================================
