import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api, BookingStatus } from '../../../lib/api';
import { formatCurrency } from '@mototrust/ui';

const lifecycleStatuses: BookingStatus[] = [
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
  'DELIVERED'
];

type ProgressPageProps = {
  searchParams: {
    bookingId?: string;
  };
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default async function BookingProgressPage({ searchParams }: ProgressPageProps) {
  if (!searchParams.bookingId) {
    redirect('/');
  }

  const booking = await api.getBooking(searchParams.bookingId);
  const currentIndex = lifecycleStatuses.indexOf(booking.status);

  return (
    <main className="page">
      <section className="ops-header">
        <div>
          <p className="eyebrow">Live progress</p>
          <h1>{formatStatus(booking.status)}</h1>
          <p className="lede">
            {booking.servicePackageName} · {formatCurrency(booking.quotedPrice)}
          </p>
        </div>
        <Link href="/">Home</Link>
      </section>

      <section className="timeline-layout">
        <div className="timeline-card">
          <h2>Lifecycle</h2>
          <ol className="status-rail">
            {lifecycleStatuses.map((status, index) => {
              const completed = booking.status === 'CANCELLED' ? index === 0 : index <= currentIndex;
              return (
                <li key={status} className={completed ? 'done' : ''}>
                  <span>{index + 1}</span>
                  {formatStatus(status)}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="timeline-card">
          <h2>Audit trail</h2>
          <ol className="audit-list">
            {booking.timeline.map((event) => (
              <li key={event.id}>
                <strong>{formatStatus(event.toStatus)}</strong>
                <p>
                  {event.actorName} · {event.actorType} · {formatDate(event.createdAt)}
                </p>
                {event.note ? <p>{event.note}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

