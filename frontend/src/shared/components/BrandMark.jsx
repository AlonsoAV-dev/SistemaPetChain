import logoUrl from '../../assets/Logo.jpg';

export default function BrandMark({ compact = false }) {
  return (
    <div className="brand" aria-label="PetChain">
      <span className="brand-mark" aria-hidden="true">
        <img
          src={logoUrl}
          alt="PetChain"
        />
      </span>
      {!compact && <span>PetChain</span>}
    </div>
  );
}
