const promises = [
  'Fixed service pricing',
  'Pickup and drop',
  'Genuine parts',
  'CCTV/video proof',
  'Digital service history'
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">MotoTrust</p>
        <h1>Motorcycle servicing you can verify.</h1>
        <p className="lede">
          Book fixed-price service, track the work, review proof, and keep a permanent digital history for every motorcycle.
        </p>
        <div className="actions">
          <a href="/login">Log in</a>
          <a href="/register">Complete profile</a>
          <a href="/admin/bookings">Operations</a>
        </div>
      </section>
      <section className="promises" aria-label="MotoTrust promises">
        {promises.map((promise) => (
          <article key={promise}>
            <h2>{promise}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
