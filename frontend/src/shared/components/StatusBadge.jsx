const statusClass = {
  urgente: 'danger',
  pendiente: 'warning',
  aprobado: 'success',
  activo: '',
  disponible: 'success',
  'en adopción': 'adoption',
  seguimiento: 'warning',
};

export default function StatusBadge({ status }) {
  const normalized = String(status).toLowerCase();
  const className = statusClass[normalized] ?? '';

  return <span className={`status-badge ${className}`}>{status}</span>;
}
