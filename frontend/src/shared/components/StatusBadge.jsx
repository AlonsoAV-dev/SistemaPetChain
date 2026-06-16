const statusClass = {
  urgente: 'danger',
  pendiente: 'warning',
  rechazado: 'danger',
  suspendido: 'danger',
  aprobado: 'success',
  activo: 'success',
  encontrado: 'success',
  adoptado: 'success',
  disponible: 'success',
  reservado: 'warning',
  cerrado: '',
  'en adopción': 'adoption',
  seguimiento: 'warning',
  pending: 'warning',
  contacted: 'warning',
  accepted: 'success',
  verified: 'success',
  rejected: 'danger',
  dismissed: 'danger',
  cancelled: '',
};

export default function StatusBadge({ status }) {
  const normalized = String(status).toLowerCase();
  const labels = {
    pending: 'Pendiente',
    contacted: 'Contactado',
    accepted: 'Aceptado',
    verified: 'Verificado',
    rejected: 'Rechazado',
    dismissed: 'Descartado',
    cancelled: 'Cancelado',
  };
  return <span className={`status-badge ${statusClass[normalized] ?? ''}`}>{labels[normalized] ?? status}</span>;
}
