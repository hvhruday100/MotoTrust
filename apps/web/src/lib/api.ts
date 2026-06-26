import 'server-only';

import { cookies } from 'next/headers';

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
export type InspectionIssueSeverity = 'CRITICAL' | 'RECOMMENDED' | 'OPTIONAL';
export type IssueApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ServiceTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type UserRole = 'CUSTOMER' | 'MECHANIC' | 'ADMIN';

export type AppUser = {
  id: string;
  firebaseUid: string;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
  role: UserRole;
  customerProfileId?: string | null;
};

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

export type InspectionIssue = {
  id: string;
  title: string;
  description?: string | null;
  severity: InspectionIssueSeverity;
  estimatedPartsCost: number;
  estimatedLaborCost: number;
  imageUrls: string[];
  approvalStatus: IssueApprovalStatus;
  customerDecisionAt?: string | null;
  customerDecisionById?: string | null;
  customerDecisionByName?: string | null;
  customerDecisionNote?: string | null;
};

export type InspectionApprovalSummary = {
  totalIssues: number;
  pendingIssues: number;
  criticalIssues: number;
  criticalApproved: number;
  criticalRejected: number;
  approvalComplete: boolean;
  allCriticalApproved: boolean;
  canStartService: boolean;
};

export type InspectionReport = {
  id: string;
  bookingId: string;
  summary?: string | null;
  createdByType: BookingActorType;
  createdById?: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  issues: InspectionIssue[];
  approvalSummary: InspectionApprovalSummary;
};

export type ServicePartUsage = {
  id: string;
  partId: string;
  sku: string;
  name: string;
  manufacturer: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchCode?: string | null;
  verifiedAt?: string | null;
};

export type ServiceTask = {
  id: string;
  serviceOrderId: string;
  bookingId: string;
  bookingStatus: BookingStatus;
  name: string;
  description?: string | null;
  status: ServiceTaskStatus;
  assignedMechanicId?: string | null;
  assignedMechanicName?: string | null;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  partsUsed: ServicePartUsage[];
};

export type ServiceExecutionBoard = {
  bookingId: string;
  bookingStatus: BookingStatus;
  serviceOrderId: string;
  serviceOrderStatus: string;
  startedAt?: string | null;
  completedAt?: string | null;
  tasks: ServiceTask[];
};

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = cookies().get('mototrust_token')?.value;
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  listMotorcycles(customerId: string) {
    return request<Motorcycle[]>(`/customers/${customerId}/motorcycles`);
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
  },

  createInspectionReport(bookingId: string, input: JsonObject) {
    return request<InspectionReport>(`/bookings/${bookingId}/inspection-report`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  getInspectionReport(bookingId: string) {
    return request<InspectionReport>(`/bookings/${bookingId}/inspection-report`);
  },

  approveInspectionIssue(issueId: string, input: JsonObject) {
    return request<InspectionReport>(`/inspection-issues/${issueId}/approval`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  },

  getServiceExecution(bookingId: string) {
    return request<ServiceExecutionBoard>(`/bookings/${bookingId}/service-execution`);
  },

  listMechanicTasks(mechanicId: string) {
    return request<ServiceTask[]>(`/mechanics/${mechanicId}/service-tasks`);
  },

  updateServiceTask(taskId: string, input: JsonObject) {
    return request<ServiceTask>(`/service-tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  },

  addServiceTaskPart(taskId: string, input: JsonObject) {
    return request<ServiceTask>(`/service-tasks/${taskId}/parts`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  getCurrentUser() {
    return request<AppUser>('/auth/me');
  },

  completeCustomerOnboarding(input: JsonObject) {
    return request<Customer>('/auth/onboard/customer', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }
};
