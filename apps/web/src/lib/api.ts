type JsonObject = Record<string, unknown>;

export type BookingStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'RECEIVED_AT_SERVICE_CENTER'
  | 'INSPECTION_COMPLETED'
  | 'AWAITING_CUSTOMER_APPROVAL'
  | 'APPROVED_FOR_SERVICE'
  | 'IN_SERVICE'
  | 'QUALITY_CHECK'
  | 'READY_FOR_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type BookingActorType = 'CUSTOMER' | 'OPS' | 'MECHANIC' | 'ADMIN' | 'SYSTEM';

export type Customer = {
  id: string;
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

export type Motorcycle = {
  id: string;
  customerId: string;
  registrationNumber: string;
  brand: string;
  model: string;
  variant?: string | null;
  year?: number | null;
  odometerKm?: number | null;
  createdAt: string;
};

export type ServicePackage = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  fixedPrice: number;
  estimatedMinutes: number;
};

export type ServiceBooking = {
  id: string;
  customerId: string;
  motorcycleId: string;
  servicePackageId: string;
  servicePackageName: string;
  quotedPrice: number;
  status: BookingStatus;
  preferredPickupAt: string;
  customerNotes?: string | null;
  createdAt: string;
};

export type BookingTimelineEvent = {
  id: string;
  fromStatus?: BookingStatus | null;
  toStatus: BookingStatus;
  actorType: BookingActorType;
  actorId?: string | null;
  actorName: string;
  note?: string | null;
  createdAt: string;
};

export type BookingDetail = ServiceBooking & {
  timeline: BookingTimelineEvent[];
};

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  registerCustomer(input: JsonObject) {
    return request<Customer>('/customers/register', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  addMotorcycle(customerId: string, input: JsonObject) {
    return request<Motorcycle>(`/customers/${customerId}/motorcycles`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  listServicePackages() {
    return request<ServicePackage[]>('/pricing/service-packages');
  },

  createBooking(input: JsonObject) {
    return request<ServiceBooking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  getBooking(bookingId: string) {
    return request<BookingDetail>(`/bookings/${bookingId}`);
  },

  listBookings(customerId: string) {
    return request<ServiceBooking[]>(`/customers/${customerId}/bookings`);
  },

  listAdminBookings() {
    return request<ServiceBooking[]>('/admin/bookings');
  },

  updateBookingStatus(bookingId: string, input: JsonObject) {
    return request<BookingDetail>(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  }
};
