export default function StatCard({ icon: Icon, label, value, detail, tone = 'green' }) {
  return (
    <article className="stat-card">
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {detail && <small>{detail}</small>}
      </div>
      {Icon && (
        <span className={`stat-icon stat-icon-${tone}`}>
          <Icon size={32} aria-hidden="true" />
        </span>
      )}
    </article>
  );
}
