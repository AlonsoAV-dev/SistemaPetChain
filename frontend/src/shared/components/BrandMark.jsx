import logoUrl from '../../assets/Logo.jpg';

export default function BrandMark({ compact = false }) {
  return (
    <div className="brand" aria-label="VetChain">
      <span className="brand-mark" aria-hidden="true">
        <img
          src={logoUrl}
          alt="VetChain"
        />
      </span>
      {!compact && <span>VetChain</span>}
    </div>
  );
}
