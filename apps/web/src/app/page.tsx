import { AppShell } from '../components/app-shell';

const promises = [
  'Fixed service pricing',
  'Pickup and drop',
  'Genuine parts',
  'CCTV/video proof',
  'Digital service history'
];

export default function HomePage() {
  return (
    <AppShell
      currentPath="/"
      eyebrow="MotoTrust"
      title="Motorcycle servicing you can verify."
      description="Book fixed-price service, track the work, review proof, and keep a permanent digital history for every motorcycle."
      actions={
        <div className="actions">
          <a href="/login">Log in</a>
          <a href="/register">Complete profile</a>
        </div>
      }
    >
      <section className="promises" aria-label="MotoTrust promises">
        {promises.map((promise) => (
          <article key={promise}>
            <h2>{promise}</h2>
            <p>Designed to keep pricing, work visibility, and service records easy to trust.</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
