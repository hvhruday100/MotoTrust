import Link from 'next/link';
import { AppShell } from '../../../components/app-shell';
import { NotificationBell } from '../../../components/notification-bell';

type BookingSuccessPageProps = {
  searchParams: {
    bookingId?: string;
  };
};

export default function BookingSuccessPage({ searchParams }: BookingSuccessPageProps) {
  return (
    <AppShell
      role="CUSTOMER"
      currentPath="/bookings"
      eyebrow="Booking confirmed"
      title="Service booking created."
      description={`Booking ID: ${searchParams.bookingId ?? 'created'}`}
      headerExtras={<NotificationBell />}
    >
      <section className="form-shell">
        <div className="actions">
          <Link href="/">Back home</Link>
          <Link
            href={searchParams.bookingId ? `/bookings/progress?bookingId=${searchParams.bookingId}` : '/'}
          >
            Track progress
          </Link>
          <Link href="/bookings">New booking</Link>
        </div>
      </section>
    </AppShell>
  );
}
