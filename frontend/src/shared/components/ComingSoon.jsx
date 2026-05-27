export default function ComingSoon({ title, description }) {
  const message = description ?? 'Seccion proximamente lista. Estamos afinando los detalles.';

  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <h1>{title}</h1>
          <p>{message}</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Proximamente</h2>
          <p>Volvemos pronto con esta funcionalidad.</p>
        </div>
      </section>
    </>
  );
}
