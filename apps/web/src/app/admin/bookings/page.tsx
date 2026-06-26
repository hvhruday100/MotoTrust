import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api, BookingStatus } from '../../../lib/api';
import { formatCurrency } from '@mototrust/ui';
import { AppShell } from '../../../components/app-shell';
import { NotificationBell } from '../../../components/notification-bell';
import { requireSessionUser } from '../../../lib/session';

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
  await requireSessionUser(['ADMIN']);
  const bookings = await api.listAdminBookings();
  const delayedBookings = bookings.filter((booking) => {
    if (booking.status === 'DELIVERED' || booking.status === 'CANCELLED') {
      return false;
    }

    return new Date(booking.preferredPickupAt).getTime() < Date.now();
  });
  const approvalQueue = bookings.filter((booking) => booking.status === 'AWAITING_CUSTOMER_APPROVAL');
  const activeService = bookings.filter((booking) =>
    ['APPROVED_FOR_SERVICE', 'IN_SERVICE', 'QUALITY_CHECK'].includes(booking.status)
  );

  return (
    <AppShell
      role="ADMIN"
      currentPath="/admin/bookings"
      eyebrow="Operations"
      title="Booking lifecycle"
      description="Review bookings, move status forward, and keep the auditable service timeline clean."
      headerExtras={<NotificationBell />}
      actions={<Link href="/">Home</Link>}
    >
      <section className="surface">
        <div className="metric-grid">
          <article className="metric-card">
            <strong>{bookings.length}</strong>
            <span>Total tracked bookings</span>
          </article>
          <article className="metric-card">
            <strong>{delayedBookings.length}</strong>
            <span>Delayed or overdue pickups</span>
          </article>
          <article className="metric-card">
            <strong>{approvalQueue.length}</strong>
            <span>Waiting for customer approval</span>
          </article>
          <article className="metric-card">
            <strong>{activeService.length}</strong>
            <span>Bookings in service pipeline</span>
          </article>
        </div>
      </section>

      {delayedBookings.length ? (
        <section className="timeline-card" style={{ marginTop: 24 }}>
          <h2>Priority queue</h2>
          <ul className="summary-list">
            {delayedBookings.slice(0, 3).map((booking) => (
              <li key={booking.id}>
                <strong>{booking.servicePackageName}</strong>
                <p>
                  {formatStatus(booking.status)} · Pickup scheduled for{' '}
                  {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                    new Date(booking.preferredPickupAt)
                  )}
                </p>
                <div className="actions">
                  <Link href={`/admin/inspections?bookingId=${booking.id}`}>Inspection</Link>
                  <Link href={`/bookings/progress?bookingId=${booking.id}`}>Timeline</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
                Note
                <input name="note" placeholder="Status update note" maxLength={1000} />
              </label>
              <button type="submit">Update</button>
            </form>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
