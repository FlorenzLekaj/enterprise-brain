-- ====================================================
-- REPARATUR-SCRIPT: Alte Policies löschen + neu anlegen
-- Einfach komplett reinkopieren und auf RUN klicken
-- ====================================================

-- Alte Policies löschen (falls sie schon existieren)
DROP POLICY IF EXISTS "profile: owner can select"  ON public.profiles;
DROP POLICY IF EXISTS "profile: owner can update"  ON public.profiles;
DROP POLICY IF EXISTS "org: members can select"    ON public.organizations;
DROP POLICY IF EXISTS "doc: members can select"    ON public.documents;
DROP POLICY IF EXISTS "doc: members can insert"    ON public.documents;
DROP POLICY IF EXISTS "doc: uploader can delete"   ON public.documents;

-- Policies neu anlegen
CREATE POLICY "profile: owner can select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profile: owner can update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "org: members can select"
  ON public.organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "doc: members can select"
  ON public.documents FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "doc: members can insert"
  ON public.documents FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "doc: uploader can delete"
  ON public.documents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Trigger neu anlegen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
