BEGIN;

CREATE TABLE IF NOT EXISTS public.publication_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption varchar(240),
  sort_order smallint NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publication_media_publication_idx
  ON public.publication_media (publication_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS public.adoption_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name varchar(120) NOT NULL,
  email varchar(254) NOT NULL,
  phone varchar(30) NOT NULL,
  city varchar(120) NOT NULL,
  housing varchar(120) NOT NULL,
  experience text,
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 2000),
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS adoption_requests_open_unique_idx
  ON public.adoption_requests (publication_id, requester_id)
  WHERE status IN ('pending', 'contacted', 'accepted');

CREATE INDEX IF NOT EXISTS adoption_requests_publication_idx
  ON public.adoption_requests (publication_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lost_pet_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type varchar(20) NOT NULL CHECK (report_type IN ('sighting', 'found')),
  location varchar(200) NOT NULL,
  seen_at timestamptz NOT NULL,
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 10 AND 2000),
  contact_name varchar(120) NOT NULL,
  contact_phone varchar(30) NOT NULL,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'verified', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lost_pet_reports_publication_idx
  ON public.lost_pet_reports (publication_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  publication_id uuid REFERENCES public.publications(id) ON DELETE CASCADE,
  notification_type varchar(40) NOT NULL,
  title varchar(180) NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications (recipient_id, read_at, created_at DESC);

DROP TRIGGER IF EXISTS adoption_requests_touch_updated_at ON public.adoption_requests;
CREATE TRIGGER adoption_requests_touch_updated_at
BEFORE UPDATE ON public.adoption_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS lost_pet_reports_touch_updated_at ON public.lost_pet_reports;
CREATE TRIGGER lost_pet_reports_touch_updated_at
BEFORE UPDATE ON public.lost_pet_reports
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.publication_media (publication_id, url, sort_order)
SELECT publication_id, image_url, 0
FROM public.lost_pet_publications
WHERE image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.publication_media pm
    WHERE pm.publication_id = lost_pet_publications.publication_id
      AND pm.url = lost_pet_publications.image_url
  );

INSERT INTO public.publication_media (publication_id, url, sort_order)
SELECT publication_id, image_url, 0
FROM public.adoption_publications
WHERE image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.publication_media pm
    WHERE pm.publication_id = adoption_publications.publication_id
      AND pm.url = adoption_publications.image_url
  );

REVOKE ALL ON TABLE public.publication_media FROM anon, authenticated;
REVOKE ALL ON TABLE public.adoption_requests FROM anon, authenticated;
REVOKE ALL ON TABLE public.lost_pet_reports FROM anon, authenticated;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;

COMMIT;
