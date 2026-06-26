import { redirect } from 'next/navigation';
import { api } from '../../lib/api';
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

  return (
    <main className="page form-page">
      <section className="form-shell">
        <p className="eyebrow">Step 2</p>
        <h1>Add motorcycle</h1>
        <p className="lede">Attach motorcycle details to the customer profile.</p>

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
    </main>
  );
}
