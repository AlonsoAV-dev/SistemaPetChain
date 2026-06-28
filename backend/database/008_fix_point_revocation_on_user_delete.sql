BEGIN;

CREATE OR REPLACE FUNCTION public.revoke_publication_points_before_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.moderation_status = 'approved'
    AND OLD.points_awarded > 0
    AND EXISTS (SELECT 1 FROM public.users WHERE id = OLD.owner_id) THEN
    INSERT INTO public.point_transactions (
      user_id, publication_id, transaction_type, points, description, created_by
    )
    VALUES (
      OLD.owner_id, OLD.id, 'manual_adjustment', -OLD.points_awarded,
      'Puntos revocados por eliminacion de la publicacion', NULL
    );
  END IF;

  RETURN OLD;
END;
$$;

COMMIT;
