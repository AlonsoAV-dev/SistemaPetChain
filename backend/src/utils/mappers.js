export function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPublicationStatus(status) {
  const labels = {
    approved: 'Aprobado',
    pending: 'Pendiente',
    rejected: 'Rechazado',
  };

  return labels[status] ?? status;
}
