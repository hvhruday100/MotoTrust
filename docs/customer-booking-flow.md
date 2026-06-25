# Customer Booking Flow

This is the first MotoTrust end-to-end business flow.

## Journey

1. Customer registers.
2. Customer adds motorcycle details.
3. Customer creates a fixed-price service booking with pickup/drop details.

## Web Pages

- `/register`: customer registration form.
- `/motorcycles?customerId=...`: motorcycle details form.
- `/bookings?customerId=...&motorcycleId=...`: service package and pickup/drop booking form.
- `/bookings/success?bookingId=...`: booking confirmation page.

## API Endpoints

- `POST /api/customers/register`
- `GET /api/customers/:customerId`
- `POST /api/customers/:customerId/motorcycles`
- `GET /api/customers/:customerId/motorcycles`
- `GET /api/pricing/service-packages`
- `POST /api/bookings`
- `GET /api/customers/:customerId/bookings`

Swagger is available at:

```text
http://localhost:4000/api/docs
```

## Notes

- Firebase is abstracted through a mocked identity provider for now.
- Redis is not required for this first synchronous flow.
- PostgreSQL persistence is through Prisma.
- The API requires a valid `DATABASE_URL` before the flow can be exercised locally.

