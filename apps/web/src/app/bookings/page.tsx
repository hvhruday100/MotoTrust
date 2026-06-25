import { redirect } from 'next/navigation';
import { api } from '../../lib/api';
import { formatCurrency } from '@mototrust/ui';

type BookingsPageProps = {
  searchParams: {
    customerId?: string;
    motorcycleId?: string;
  };
};

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

  redirect(`/bookings/success?bookingId=${booking.id}&customerId=${booking.customerId}`);
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  if (!searchParams.customerId || !searchParams.motorcycleId) {
    redirect('/register');
  }

  const servicePackages = await api.listServicePackages();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <main className="page form-page">
      <section className="form-shell wide">
        <p className="eyebrow">Step 3</p>
        <h1>Create service booking</h1>
        <p className="lede">Choose fixed pricing and pickup/drop details.</p>

        <form action={createBooking} className="flow-form">
          <input type="hidden" name="customerId" value={searchParams.customerId} />
          <input type="hidden" name="motorcycleId" value={searchParams.motorcycleId} />

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
            <textarea name="customerNotes" placeholder="Please call before pickup." maxLength={1000} rows={4} />
          </label>

          <button type="submit">Confirm booking</button>
        </form>
      </section>
    </main>
  );
}

