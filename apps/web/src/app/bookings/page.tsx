import { redirect } from 'next/navigation';
import { api } from '../../lib/api';
import { formatCurrency } from '@mototrust/ui';
import { AppShell } from '../../components/app-shell';
import { requireSessionUser } from '../../lib/session';

async function createBooking(formData: FormData) {
  'use server';

  const booking = await api.createBooking({
    customerId: String(formData.get('customerId') ?? ''),
    motorcycleId: String(formData.get('motorcycleId') ?? ''),
    servicePackageId: String(formData.get('servicePackageId') ?? '') || undefined,
    preferredPickupAt: new Date(String(formData.get('preferredPickupAt'))).toISOString(),
    customerNotes: String(formData.get('customerNotes') ?? '') || undefined,
    pickupAddress: {
      label: String(formData.get('pickupLabel') ?? ''),
      line1: String(formData.get('pickupLine1') ?? ''),
      line2: String(formData.get('pickupLine2') ?? '') || undefined,
      city: String(formData.get('pickupCity') ?? ''),
      state: String(formData.get('pickupState') ?? ''),
      pincode: String(formData.get('pickupPincode') ?? '')
    },
    dropAddress: {
      label: String(formData.get('dropLabel') ?? ''),
      line1: String(formData.get('dropLine1') ?? ''),
      line2: String(formData.get('dropLine2') ?? '') || undefined,
      city: String(formData.get('dropCity') ?? ''),
      state: String(formData.get('dropState') ?? ''),
      pincode: String(formData.get('dropPincode') ?? '')
    }
  });

  redirect(`/bookings/success?bookingId=${booking.id}`);
}

export default async function BookingsPage() {
  const user = await requireSessionUser(['CUSTOMER']);
  if (!user.customerProfileId) {
    redirect('/register');
  }

  const servicePackages = await api.listServicePackages();
  const motorcycles = await api.listMotorcycles(user.customerProfileId);
  const bookings = await api.listBookings(user.customerProfileId).catch(() => []);
  if (!motorcycles.length) {
    redirect('/motorcycles');
  }
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <AppShell
      role="CUSTOMER"
      currentPath="/bookings"
      eyebrow="Step 3"
      title="Create service booking"
      description="Pick the motorcycle, choose a fixed-price package, and confirm where we should collect and return the bike."
    >
      <section className="surface">
        <div className="step-strip">
          <article className="step-card">
            <strong>Profile complete</strong>
            <p>Your contact details are already on file.</p>
          </article>
          <article className="step-card">
            <strong>{motorcycles.length} motorcycle{motorcycles.length > 1 ? 's' : ''} available</strong>
            <p>Select the bike that needs service today.</p>
          </article>
          <article className="step-card active">
            <strong>Confirm pickup and return</strong>
            <p>Choose the package and pickup window before you submit.</p>
          </article>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <strong>{servicePackages.length}</strong>
            <span>Fixed-price service packages</span>
          </article>
          <article className="metric-card">
            <strong>{bookings.length}</strong>
            <span>Bookings created on this account</span>
          </article>
        </div>
      </section>

      <section className="form-shell wide">
        <form action={createBooking} className="flow-form">
          <input type="hidden" name="customerId" value={user.customerProfileId} />

          <label>
            Motorcycle
            <select name="motorcycleId" required>
              {motorcycles.map((motorcycle) => (
                <option key={motorcycle.id} value={motorcycle.id}>
                  {motorcycle.registrationNumber} - {motorcycle.brand} {motorcycle.model}
                </option>
              ))}
            </select>
          </label>

          <label>
            Service package
            <select name="servicePackageId" required>
              {servicePackages.map((servicePackage) => (
                <option key={servicePackage.id} value={servicePackage.id}>
                  {servicePackage.name} - {formatCurrency(servicePackage.fixedPrice)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Preferred pickup time
            <input name="preferredPickupAt" type="datetime-local" defaultValue={tomorrow} required />
          </label>

          <div className="choice-grid">
            {servicePackages.map((servicePackage) => (
              <article key={servicePackage.id} className="choice-card">
                <strong>{servicePackage.name}</strong>
                <p>{formatCurrency(servicePackage.fixedPrice)}</p>
                <p>{servicePackage.description ?? 'Includes transparent pricing and a tracked service workflow.'}</p>
              </article>
            ))}
          </div>

          <div className="form-grid">
            <fieldset>
              <legend>Pickup address</legend>
              <input name="pickupLabel" placeholder="Home" required minLength={2} maxLength={40} />
              <input name="pickupLine1" placeholder="Address line 1" required minLength={3} maxLength={160} />
              <input name="pickupLine2" placeholder="Address line 2" maxLength={160} />
              <input name="pickupCity" placeholder="City" required minLength={2} maxLength={80} />
              <input name="pickupState" placeholder="State" required minLength={2} maxLength={80} />
              <input name="pickupPincode" placeholder="Pincode" required minLength={6} maxLength={10} />
            </fieldset>

            <fieldset>
              <legend>Drop address</legend>
              <input name="dropLabel" placeholder="Home" required minLength={2} maxLength={40} />
              <input name="dropLine1" placeholder="Address line 1" required minLength={3} maxLength={160} />
              <input name="dropLine2" placeholder="Address line 2" maxLength={160} />
              <input name="dropCity" placeholder="City" required minLength={2} maxLength={80} />
              <input name="dropState" placeholder="State" required minLength={2} maxLength={80} />
              <input name="dropPincode" placeholder="Pincode" required minLength={6} maxLength={10} />
            </fieldset>
          </div>

          <label>
            Customer notes
            <textarea name="customerNotes" placeholder="Optional: gate code, call before pickup, or any rider note." maxLength={1000} rows={3} />
          </label>

          <button type="submit">Confirm booking</button>
        </form>
      </section>
    </AppShell>
  );
}
