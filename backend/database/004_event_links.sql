BEGIN;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_url text;

COMMENT ON COLUMN public.events.external_url IS
  'Link externo del evento: TikTok, Instagram, live, formulario o transmision.';

UPDATE public.events
SET external_url = 'https://www.instagram.com/'
WHERE external_url IS NULL
  AND title ILIKE '%jornada%';

UPDATE public.events
SET external_url = 'https://www.instagram.com/'
WHERE external_url IS NULL
  AND title ILIKE '%feria%';

UPDATE public.events
SET external_url = 'https://www.tiktok.com/'
WHERE external_url IS NULL
  AND title ILIKE '%taller%';

COMMIT;
