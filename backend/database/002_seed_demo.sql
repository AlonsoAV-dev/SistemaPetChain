BEGIN;

-- Credenciales de demostracion:
-- admin@petchain.test / AdminPet123
-- ana@petchain.test   / UsuarioPet123
-- mario@petchain.test / UsuarioPet123

INSERT INTO public.users (
  id,
  name,
  email,
  password_hash,
  role,
  status,
  avatar_url
)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Administrador PetChain',
    'admin@petchain.test',
    '120000:3381528f7af72d59153991a4b368154d:7f71e726ae8153383d4ec3a3470ca04407d623df75e7c922dcadfccdd09602e2',
    'admin',
    'active',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Ana Ruiz',
    'ana@petchain.test',
    '120000:f74891204150e195a42fd1a958782a3e:e658ed841e051e78089ba5135cd571faf9633842506cb7c0c1b5bdbe5e2c21f3',
    'user',
    'active',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Mario Torres',
    'mario@petchain.test',
    '120000:f74891204150e195a42fd1a958782a3e:e658ed841e051e78089ba5135cd571faf9633842506cb7c0c1b5bdbe5e2c21f3',
    'user',
    'active',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    avatar_url = EXCLUDED.avatar_url;

INSERT INTO public.publications (
  id,
  owner_id,
  type,
  title,
  description,
  moderation_status,
  reviewed_by,
  reviewed_at,
  approved_at,
  points_awarded,
  points_processed_at,
  created_at
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'lost_pet',
    'Mascota perdida: Firulais',
    'Perro mediano de color dorado. Llevaba un collar azul cuando se perdio.',
    'approved',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now() - interval '4 days',
    now() - interval '4 days',
    5,
    now() - interval '4 days',
    now() - interval '5 days'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'adoption',
    'Adopcion: Mishi',
    'Gatita rescatada, saludable y lista para encontrar una familia responsable.',
    'approved',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now() - interval '3 days',
    now() - interval '3 days',
    10,
    now() - interval '3 days',
    now() - interval '4 days'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'responsible_action',
    'Limpieza de parque comunitario',
    'Voluntarios limpiaron el parque y renovaron los bebederos para mascotas.',
    'approved',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now() - interval '2 days',
    now() - interval '2 days',
    20,
    now() - interval '2 days',
    now() - interval '3 days'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'adoption',
    'Adopcion: Luna',
    'Perrita joven y sociable que busca una familia con espacio y tiempo.',
    'pending',
    NULL,
    NULL,
    NULL,
    0,
    NULL,
    now() - interval '1 day'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'responsible_action',
    'Donacion de alimento',
    'Entrega de alimento para perros y gatos de una casa temporal comunitaria.',
    'pending',
    NULL,
    NULL,
    NULL,
    0,
    NULL,
    now() - interval '6 hours'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lost_pet_publications (
  publication_id,
  pet_name,
  species,
  breed,
  sex,
  size,
  zone,
  last_seen_at,
  contact_name,
  contact_phone,
  image_url,
  search_status
)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  'Firulais',
  'Perro',
  'Mestizo',
  'Macho',
  'Mediano',
  'Miraflores, Lima',
  now() - interval '6 days',
  'Ana Ruiz',
  '999111222',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80',
  'active'
)
ON CONFLICT (publication_id) DO NOTHING;

INSERT INTO public.adoption_publications (
  publication_id,
  pet_name,
  species,
  age_label,
  breed,
  sex,
  vaccinated,
  sterilized,
  personality,
  contact_name,
  contact_phone,
  image_url,
  adoption_status
)
VALUES
  (
    '10000000-0000-4000-8000-000000000002',
    'Mishi',
    'Gato',
    '4 meses',
    'Mestiza',
    'Hembra',
    true,
    false,
    'Juguetona, curiosa y carinosa.',
    'Mario Torres',
    '999333444',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80',
    'available'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Luna',
    'Perro',
    '1 ano',
    'Mestiza',
    'Hembra',
    true,
    true,
    'Sociable, activa y acostumbrada a convivir con personas.',
    'Ana Ruiz',
    '999111222',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80',
    'available'
  )
ON CONFLICT (publication_id) DO NOTHING;

INSERT INTO public.responsible_action_publications (
  publication_id,
  category,
  action_date,
  location,
  evidence_url
)
VALUES
  (
    '10000000-0000-4000-8000-000000000003',
    'Medio ambiente',
    current_date - 3,
    'Parque Kennedy, Miraflores',
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'Ayuda comunitaria',
    current_date - 1,
    'Casa temporal Surco',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80'
  )
ON CONFLICT (publication_id) DO NOTHING;

INSERT INTO public.moderation_reviews (
  id,
  publication_id,
  admin_id,
  decision,
  reason,
  created_at
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'approved',
    NULL,
    now() - interval '4 days'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'approved',
    NULL,
    now() - interval '3 days'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'approved',
    NULL,
    now() - interval '2 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.point_transactions (
  id,
  user_id,
  publication_id,
  transaction_type,
  points,
  description,
  created_by,
  created_at
)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    'publication_approved',
    5,
    'Puntos por publicacion aprobada',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now() - interval '4 days'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '10000000-0000-4000-8000-000000000002',
    'publication_approved',
    10,
    'Puntos por publicacion aprobada',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now() - interval '3 days'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000003',
    'publication_approved',
    20,
    'Puntos por publicacion aprobada',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now() - interval '2 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.publication_likes (publication_id, user_id)
VALUES
  (
    '10000000-0000-4000-8000-000000000003',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.articles (
  id,
  author_admin_id,
  category,
  title,
  description,
  content,
  image_url,
  published,
  published_at
)
VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Salud',
    'Importancia de la vacunacion',
    'Conoce por que las vacunas son esenciales para el bienestar de tu mascota.',
    'Las vacunas ayudan a prevenir enfermedades graves. Consulta siempre el calendario recomendado por un medico veterinario.',
    'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80',
    true,
    now() - interval '5 days'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Educacion',
    'Guia de tenencia responsable',
    'Acciones sencillas que mejoran la vida de las mascotas y la comunidad.',
    'Identificacion, controles veterinarios, alimentacion adecuada, ejercicio y respeto por los espacios publicos son pilares de una tenencia responsable.',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80',
    true,
    now() - interval '4 days'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Adopcion',
    'Preparar el hogar para una adopcion',
    'Recomendaciones para recibir a una nueva mascota de forma segura.',
    'Prepara una zona tranquila, establece rutinas progresivas y permite que la mascota se adapte a su propio ritmo.',
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=900&q=80',
    true,
    now() - interval '3 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (
  id,
  created_by_admin_id,
  title,
  description,
  starts_at,
  ends_at,
  location,
  capacity,
  published
)
VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Feria de adopciones',
    'Encuentro comunitario con mascotas vacunadas y listas para adopcion.',
    now() + interval '10 days',
    now() + interval '10 days 4 hours',
    'Parque Kennedy, Miraflores',
    100,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Taller de tenencia responsable',
    'Taller gratuito sobre salud, identificacion y convivencia responsable.',
    now() + interval '17 days',
    now() + interval '17 days 2 hours',
    'Centro comunitario de Surco',
    50,
    true
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

SELECT
  (SELECT count(*) FROM public.users) AS users,
  (SELECT count(*) FROM public.publications) AS publications,
  (SELECT count(*) FROM public.articles) AS articles,
  (SELECT count(*) FROM public.events) AS events;
