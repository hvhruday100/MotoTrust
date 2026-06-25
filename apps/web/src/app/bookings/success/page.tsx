import Link from 'next/link';

type BookingSuccessPageProps = {
  searchParams: {
    bookingId?: string;
    customerId?: string;
  };
};

export default function BookingSuccessPage({ searchParams }: BookingSuccessPageProps) {
  return (
    <main className="page form-page">
      <section className="form-shell">
        <p className="eyebrow">Booking confirmed</p>
        <h1>Service booking created.</h1>
        <p className="lede">
          Booking ID: <strong>{searchParams.bookingId ?? 'created'}</strong>
        </p>
        <div className="actions">
          <Link href="/">Back home</Link>
          <Link href={searchParams.bookingId ? `/bookings/progress?bookingId=${searchParams.bookingId}` : '/'}>
            Track progress
          </Link>
          <Link href={searchParams.customerId ? `/bookings?customerId=${searchParams.customerId}` : '/register'}>
            New booking
          </Link>
        </div>
      </section>
    </main>
  );
}
