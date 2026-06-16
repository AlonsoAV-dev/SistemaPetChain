import { useEffect, useState } from 'react';

export default function PhotoGallery({ images = [], alt = 'Publicación' }) {
  const [active, setActive] = useState(images[0] ?? '');

  useEffect(() => {
    setActive(images[0] ?? '');
  }, [images]);

  if (!images.length) {
    return <div className="detail-gallery-empty">Sin fotografías disponibles</div>;
  }

  return (
    <div className="detail-gallery">
      <img className="detail-gallery-main" src={active} alt={alt} />
      {images.length > 1 && (
        <div className="detail-gallery-thumbnails">
          {images.map((image, index) => (
            <button
              className={active === image ? 'active' : ''}
              key={image}
              type="button"
              onClick={() => setActive(image)}
              aria-label={`Ver fotografía ${index + 1}`}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
