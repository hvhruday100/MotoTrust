import { z } from 'zod';

export const bookingStatuses = [
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
] as const;

export const bookingActorTypes = ['CUSTOMER', 'OPS', 'MECHANIC', 'ADMIN', 'SYSTEM'] as const;
export const inspectionIssueSeverities = ['CRITICAL', 'RECOMMENDED', 'OPTIONAL'] as const;
export const issueApprovalStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const registerCustomerSchema = z
  .object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().optional(),
    phone: z.string().min(8).max(20).optional(),
    firebaseUid: z.string().max(160).optional()
  })
  .refine((value) => value.email || value.phone, {
    message: 'Either email or phone is required.',
    path: ['email']
  });

export const motorcycleSchema = z.object({
  registrationNumber: z.string().min(4).max(20),
  brand: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().optional(),
  year: z.number().int().min(1990).max(2100).optional(),
  odometerKm: z.number().int().nonnegative().optional()
});

export const addressSchema = z.object({
  label: z.string().min(2).max(40),
  line1: z.string().min(3).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().min(6).max(10)
});

export const createBookingSchema = z.object({
  customerId: z.string().min(1),
  motorcycleId: z.string().min(1),
  servicePackageId: z.string().min(1).optional(),
  pickupAddressId: z.string().min(1),
  dropAddressId: z.string().min(1),
  preferredPickupAt: z.string().datetime(),
  customerNotes: z.string().max(1000).optional()
});

export const createServiceBookingSchema = z.object({
  customerId: z.string().min(1),
  motorcycleId: z.string().min(1),
  servicePackageId: z.string().min(1).optional(),
  preferredPickupAt: z.string().datetime(),
  customerNotes: z.string().max(1000).optional(),
  pickupAddress: addressSchema,
  dropAddress: addressSchema
});

export const updateBookingStatusSchema = z.object({
  nextStatus: z.enum(bookingStatuses),
  actorType: z.enum(bookingActorTypes),
  actorName: z.string().min(2).max(120),
  actorId: z.string().max(160).optional(),
  note: z.string().max(1000).optional()
});

export const inspectionIssueSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  severity: z.enum(inspectionIssueSeverities),
  estimatedPartsCost: z.number().nonnegative(),
  estimatedLaborCost: z.number().nonnegative(),
  imageUrls: z.array(z.string().url()).default([])
});

export const createInspectionReportSchema = z.object({
  summary: z.string().max(1000).optional(),
  createdByType: z.enum(bookingActorTypes),
  createdById: z.string().max(160).optional(),
  createdByName: z.string().min(2).max(120),
  issues: z.array(inspectionIssueSchema).min(1)
});

export const approveInspectionIssueSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  actorId: z.string().max(160).optional(),
  actorName: z.string().min(2).max(120),
  note: z.string().max(1000).optional()
});

export type BookingStatus = (typeof bookingStatuses)[number];
export type BookingActorType = (typeof bookingActorTypes)[number];
export type InspectionIssueSeverity = (typeof inspectionIssueSeverities)[number];
export type IssueApprovalStatus = (typeof issueApprovalStatuses)[number];
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type MotorcycleInput = z.infer<typeof motorcycleSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateServiceBookingInput = z.infer<typeof createServiceBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateInspectionReportInput = z.infer<typeof createInspectionReportSchema>;
export type ApproveInspectionIssueInput = z.infer<typeof approveInspectionIssueSchema>;
