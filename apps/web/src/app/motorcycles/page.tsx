import { redirect } from 'next/navigation';
import { api } from '../../lib/api';
import { AppShell } from '../../components/app-shell';
import { NotificationBell } from '../../components/notification-bell';
import { requireSessionUser } from '../../lib/session';

async function addMotorcycle(formData: FormData) {
  'use server';

  const customerId = String(formData.get('customerId') ?? '');
  const motorcycle = await api.addMotorcycle(customerId, {
    registrationNumber: String(formData.get('registrationNumber') ?? ''),
    brand: String(formData.get('brand') ?? ''),
    model: String(formData.get('model') ?? ''),
    variant: String(formData.get('variant') ?? '') || undefined,
    year: formData.get('year') ? Number(formData.get('year')) : undefined,
    odometerKm: formData.get('odometerKm') ? Number(formData.get('odometerKm')) : undefined
  });

  redirect('/bookings');
}

export default async function MotorcyclesPage() {
  const user = await requireSessionUser(['CUSTOMER']);
  if (!user.customerProfileId) {
    redirect('/register');
  }
  const motorcycles = await api.listMotorcycles(user.customerProfileId);

  return (
    <AppShell
      role="CUSTOMER"
      currentPath="/motorcycles"
      eyebrow="Step 2"
      title="Add your motorcycle"
      description="Save the bike once so future service bookings take only a few taps."
      headerExtras={<NotificationBell />}
    >
      <section className="surface">
        <h2 className="page-section-title">Saved motorcycles</h2>
        <div className="metric-grid">
          <article className="metric-card">
            <strong>{motorcycles.length}</strong>
            <span>Motorcycles on your account</span>
          </article>
          <article className="metric-card">
            <strong>{motorcycles.length ? 'Ready' : 'Next step'}</strong>
            <span>
              {motorcycles.length
                ? 'You can book service any time.'
                : 'Add your first motorcycle to continue.'}
            </span>
          </article>
        </div>

        {motorcycles.length ? (
          <div className="choice-grid">
            {motorcycles.map((motorcycle) => (
              <article key={motorcycle.id} className="choice-card">
                <strong>
                  {motorcycle.brand} {motorcycle.model}
                </strong>
                <p>{motorcycle.registrationNumber}</p>
                <p>
                  {motorcycle.variant ?? 'Variant not specified'}
                  {motorcycle.odometerKm ? ` · ${motorcycle.odometerKm.toLocaleString('en-IN')} km` : ''}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="form-shell">
        <div className="step-strip">
          <article className="step-card">
            <strong>Identity ready</strong>
            <p>Your customer profile is already linked to this session.</p>
          </article>
          <article className="step-card active">
            <strong>Save the motorcycle</strong>
            <p>Registration number and bike model are enough to get started.</p>
          </article>
          <article className="step-card">
            <strong>Book service</strong>
            <p>Next, choose pickup time and package.</p>
          </article>
        </div>

        <form action={addMotorcycle} className="flow-form">
          <input type="hidden" name="customerId" value={user.customerProfileId} />

          <label>
            Registration number
            <input name="registrationNumber" placeholder="KA01AB1234" required minLength={4} maxLength={20} />
          </label>

          <label>
            Brand
            <input name="brand" placeholder="Royal Enfield" required minLength={2} maxLength={80} />
          </label>

          <label>
            Model
            <input name="model" placeholder="Classic 350" required minLength={1} maxLength={80} />
          </label>

          <label>
            Variant
            <input name="variant" placeholder="Signals Edition" maxLength={80} />
          </label>

          <div className="form-grid">
            <label>
              Year
              <input name="year" type="number" min={1990} max={2100} placeholder="2022" />
            </label>

            <label>
              Odometer
              <input name="odometerKm" type="number" min={0} placeholder="18500" />
            </label>
          </div>

          <button type="submit">Continue</button>
        </form>
      </section>
    </AppShell>
  );
}
