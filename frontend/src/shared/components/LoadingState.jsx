import { LoaderCircle } from 'lucide-react';

export default function LoadingState({ label = 'Cargando datos...', compact = false }) {
  return (
    <div className={`loading-state${compact ? ' compact' : ''}`} role="status" aria-live="polite">
      <LoaderCircle className="loading-spinner" size={compact ? 22 : 34} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
