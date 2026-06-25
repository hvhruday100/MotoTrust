import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api, BookingStatus } from '../../../lib/api';
import { formatCurrency } from '@mototrust/ui';

const bookingStatuses: BookingStatus[] = [
  'CREATED',
  'CONFIRMED',
  'PICKUP_ASSIGNED',
  'PICKED_UP',
  'RECEIVED_AT_SERVICE_CENTER',
  'INSPECTION_COMPLETED',
  'AWAITING_CUSTOMER_APPROVAL',
  'APPROVED_FOR_SERVICE',
  'IN_SERVICE',
  'QUALITY_CHECK',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
];

async function updateBookingStatus(formData: FormData) {
  'use server';

  const bookingId = String(formData.get('bookingId') ?? '');
  await api.updateBookingStatus(bookingId, {
    nextStatus: String(formData.get('nextStatus') ?? ''),
    actorType: String(formData.get('actorType') ?? 'ADMIN'),
    actorName: String(formData.get('actorName') ?? ''),
    note: String(formData.get('note') ?? '') || undefined
  });

  redirect('/admin/bookings');
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function AdminBookingsPage() {
  const bookings = await api.listAdminBookings();

  return (
    <main className="page">
      <section className="ops-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Booking lifecycle</h1>
          <p className="lede">Update booking state and append an auditable timeline event.</p>
        </div>
        <Link href="/">Home</Link>
      </section>

      <section className="ops-list">
        {bookings.map((booking) => (
          <article key={booking.id} className="booking-row">
            <div className="booking-summary">
              <p className="mono">{booking.id}</p>
              <h2>{booking.servicePackageName}</h2>
              <p>
                {formatCurrency(booking.quotedPrice)} · {formatStatus(booking.status)}
              </p>
              <div className="actions">
                <Link href={`/bookings/progress?bookingId=${booking.id}`}>View timeline</Link>
                <Link href={`/admin/inspections?bookingId=${booking.id}`}>Inspection</Link>
                <Link href={`/admin/service-execution?bookingId=${booking.id}`}>Service board</Link>
              </div>
            </div>

            <form action={updateBookingStatus} className="status-form">
              <input type="hidden" name="bookingId" value={booking.id} />
              <label>
                Next status
                <select name="nextStatus" defaultValue="">
                  <option value="" disabled>
                    Select status
                  </option>
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Actor
                <input name="actorName" defaultValue="Service Desk Admin" minLength={2} maxLength={120} required />
              </label>
              <input type="hidden" name="actorType" value="ADMIN" />
              <label>
                Note
                <input name="note" placeholder="Status update note" maxLength={1000} />
              </label>
              <button type="submit">Update</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
