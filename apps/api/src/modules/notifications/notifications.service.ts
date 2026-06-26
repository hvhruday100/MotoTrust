import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, ServiceTaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationUnreadCountResponseDto } from './dto/notification-unread-count-response.dto';
import { NotificationDeliveryHooksService } from './notification-delivery-hooks.service';

const APPROVAL_ALERT_THRESHOLD_HOURS = 2;
const BOOKING_DELAY_THRESHOLD_HOURS = 24;
const WORKLOAD_IMBALANCE_THRESHOLD = 3;
const WORKLOAD_ALERT_MIN_OPEN_TASKS = 4;

type NotificationCreateInput = {
  userId: string;
  bookingId?: string | null;
  title: string;
  message: string;
  category: string;
  actionUrl?: string | null;
  dedupeKey?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly deliveryHooks: NotificationDeliveryHooksService
  ) {}

  async listForUser(user: AuthenticatedAppUser): Promise<NotificationResponseDto[]> {
    await this.ensureOperationalNotifications(user);

    const notifications = await this.prisma.appNotification.findMany({
      where: { userId: user.id },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take: 100
    });

    return notifications.map((notification) => this.toResponse(notification));
  }

  async getUnreadCount(user: AuthenticatedAppUser): Promise<NotificationUnreadCountResponseDto> {
    await this.ensureOperationalNotifications(user);

    const unreadCount = await this.prisma.appNotification.count({
      where: {
        userId: user.id,
        readAt: null
      }
    });

    return { unreadCount };
  }

  async markAsRead(notificationId: string, user: AuthenticatedAppUser): Promise<NotificationResponseDto> {
    const existing = await this.prisma.appNotification.findFirst({
      where: {
        id: notificationId,
        userId: user.id
      }
    });

    if (!existing) {
      throw new NotFoundException('Notification not found.');
    }

    const updated = await this.prisma.appNotification.update({
      where: { id: notificationId },
      data: {
        readAt: existing.readAt ?? new Date()
      }
    });

    return this.toResponse(updated);
  }

  async markAllAsRead(user: AuthenticatedAppUser): Promise<NotificationUnreadCountResponseDto> {
    await this.prisma.appNotification.updateMany({
      where: {
        userId: user.id,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return { unreadCount: 0 };
  }

  async notifyCustomerBookingCreated(input: {
    bookingId: string;
    customerUserId: string;
    servicePackageName: string;
  }): Promise<void> {
    await this.createNotification({
      userId: input.customerUserId,
      bookingId: input.bookingId,
      title: 'Booking confirmed',
      message: `Your ${input.servicePackageName} booking has been created and is now in the MotoTrust queue.`,
      category: 'CUSTOMER_BOOKING_CREATED',
      actionUrl: `/bookings/progress?bookingId=${input.bookingId}`,
      dedupeKey: `customer-booking-created:${input.bookingId}:${input.customerUserId}`
    });
  }

  async notifyAdminsNewBooking(input: {
    bookingId: string;
    servicePackageName: string;
    customerName: string;
  }): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true
      },
      select: { id: true }
    });

    await Promise.all(
      admins.map((admin) =>
        this.createNotification({
          userId: admin.id,
          bookingId: input.bookingId,
          title: 'New booking created',
          message: `${input.customerName} created a new ${input.servicePackageName} booking.`,
          category: 'ADMIN_NEW_BOOKING',
          actionUrl: `/admin/bookings`,
          dedupeKey: `admin-new-booking:${input.bookingId}:${admin.id}`
        })
      )
    );
  }

  async notifyCustomerBookingStatus(input: {
    bookingId: string;
    customerUserId: string;
    nextStatus: BookingStatus;
  }): Promise<void> {
    const config = this.getCustomerStatusNotification(input.bookingId, input.nextStatus);
    if (!config) {
      return;
    }

    await this.createNotification({
      userId: input.customerUserId,
      bookingId: input.bookingId,
      title: config.title,
      message: config.message,
      category: `CUSTOMER_${input.nextStatus}`,
      actionUrl: `/bookings/progress?bookingId=${input.bookingId}`,
      dedupeKey: `customer-status:${input.bookingId}:${input.customerUserId}:${input.nextStatus}`
    });
  }

  async notifyMechanicTaskAssignment(input: {
    bookingId: string;
    taskId: string;
    taskName: string;
    assignedMechanicId: string;
    assignedMechanicName?: string | null;
    previousAssignedMechanicId?: string | null;
  }): Promise<void> {
    const wasReassigned =
      input.previousAssignedMechanicId && input.previousAssignedMechanicId !== input.assignedMechanicId;

    await this.createNotification({
      userId: input.assignedMechanicId,
      bookingId: input.bookingId,
      title: wasReassigned ? 'Task reassigned to you' : 'New task assigned',
      message: wasReassigned
        ? `You were reassigned to ${input.taskName}.`
        : `You have been assigned to ${input.taskName}.`,
      category: wasReassigned ? 'MECHANIC_TASK_REASSIGNED' : 'MECHANIC_TASK_ASSIGNED',
      actionUrl: `/mechanic/tasks?taskId=${input.taskId}`,
      dedupeKey: `mechanic-task-assignment:${input.taskId}:${input.assignedMechanicId}:${wasReassigned ? 'reassigned' : 'assigned'}`
    });

    if (wasReassigned && input.previousAssignedMechanicId) {
      await this.createNotification({
        userId: input.previousAssignedMechanicId,
        bookingId: input.bookingId,
        title: 'Task moved to another mechanic',
        message: `${input.taskName} has been reassigned.`,
        category: 'MECHANIC_TASK_REMOVED',
        actionUrl: `/mechanic/tasks`,
        dedupeKey: `mechanic-task-removed:${input.taskId}:${input.previousAssignedMechanicId}`
      });
    }
  }

  async notifyMechanicsCustomerApprovedInspection(input: {
    bookingId: string;
    issueTitle: string;
  }): Promise<void> {
    const mechanicIds = await this.getAssignedMechanicIdsForBooking(input.bookingId);

    await Promise.all(
      mechanicIds.map((mechanicId) =>
        this.createNotification({
          userId: mechanicId,
          bookingId: input.bookingId,
          title: 'Customer approved inspection item',
          message: `The customer approved "${input.issueTitle}".`,
          category: 'MECHANIC_INSPECTION_APPROVED',
          actionUrl: `/bookings/progress?bookingId=${input.bookingId}`,
          dedupeKey: `mechanic-approval:${input.bookingId}:${mechanicId}:${input.issueTitle}`
        })
      )
    );
  }

  async notifyMechanicsWorkCanBegin(bookingId: string): Promise<void> {
    const mechanicIds = await this.getAssignedMechanicIdsForBooking(bookingId);

    await Promise.all(
      mechanicIds.map((mechanicId) =>
        this.createNotification({
          userId: mechanicId,
          bookingId,
          title: 'Work can begin',
          message: 'All required customer approvals are complete. Service work can start now.',
          category: 'MECHANIC_WORK_CAN_BEGIN',
          actionUrl: `/mechanic/tasks`,
          dedupeKey: `mechanic-work-can-begin:${bookingId}:${mechanicId}`
        })
      )
    );
  }

  private async ensureOperationalNotifications(user: AuthenticatedAppUser): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      return;
    }

    await Promise.all([
      this.ensurePendingApprovalAlerts(user.id),
      this.ensureDelayedBookingAlerts(user.id),
      this.ensureWorkloadImbalanceAlert(user.id)
    ]);
  }

  private async ensurePendingApprovalAlerts(adminUserId: string): Promise<void> {
    const threshold = new Date(Date.now() - APPROVAL_ALERT_THRESHOLD_HOURS * 60 * 60 * 1000);
    const staleBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.AWAITING_CUSTOMER_APPROVAL,
        updatedAt: { lte: threshold }
      },
      include: {
        customer: true
      }
    });

    await Promise.all(
      staleBookings.map((booking) =>
        this.createNotification({
          userId: adminUserId,
          bookingId: booking.id,
          title: 'Customer approval pending too long',
          message: `${booking.customer.fullName} has not responded to inspection approvals for over ${APPROVAL_ALERT_THRESHOLD_HOURS} hours.`,
          category: 'ADMIN_APPROVAL_STALE',
          actionUrl: `/bookings/approval?bookingId=${booking.id}`,
          dedupeKey: `admin-approval-stale:${booking.id}:${adminUserId}`
        })
      )
    );
  }

  private async ensureDelayedBookingAlerts(adminUserId: string): Promise<void> {
    const threshold = new Date(Date.now() - BOOKING_DELAY_THRESHOLD_HOURS * 60 * 60 * 1000);
    const delayedBookings = await this.prisma.booking.findMany({
      where: {
        createdAt: { lte: threshold },
        status: {
          notIn: [BookingStatus.DELIVERED, BookingStatus.CANCELLED]
        }
      },
      include: {
        customer: true
      },
      take: 20
    });

    await Promise.all(
      delayedBookings.map((booking) =>
        this.createNotification({
          userId: adminUserId,
          bookingId: booking.id,
          title: 'Booking delayed beyond SLA',
          message: `${booking.customer.fullName}'s booking has been open longer than ${BOOKING_DELAY_THRESHOLD_HOURS} hours.`,
          category: 'ADMIN_BOOKING_DELAYED',
          actionUrl: `/admin/bookings`,
          dedupeKey: `admin-booking-delayed:${booking.id}:${adminUserId}`
        })
      )
    );
  }

  private async ensureWorkloadImbalanceAlert(adminUserId: string): Promise<void> {
    const mechanics = await this.prisma.user.findMany({
      where: {
        role: UserRole.MECHANIC,
        isActive: true
      },
      select: {
        id: true,
        displayName: true,
        email: true
      }
    });

    if (mechanics.length < 2) {
      return;
    }

    const grouped = await this.prisma.serviceTask.groupBy({
      by: ['assignedMechanicId'],
      where: {
        assignedMechanicId: { not: null },
        status: {
          in: [ServiceTaskStatus.PENDING, ServiceTaskStatus.IN_PROGRESS]
        }
      },
      _count: {
        _all: true
      }
    });

    const workloadByMechanic = mechanics.map((mechanic) => ({
      ...mechanic,
      openTasks: grouped.find((entry) => entry.assignedMechanicId === mechanic.id)?._count._all ?? 0
    }));

    const sorted = [...workloadByMechanic].sort((left, right) => right.openTasks - left.openTasks);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    if (!highest || !lowest) {
      return;
    }

    if (highest.openTasks < WORKLOAD_ALERT_MIN_OPEN_TASKS) {
      return;
    }

    if (highest.openTasks - lowest.openTasks < WORKLOAD_IMBALANCE_THRESHOLD) {
      return;
    }

    await this.createNotification({
      userId: adminUserId,
      title: 'Mechanic workload imbalance detected',
      message: `${this.describeUser(highest)} has ${highest.openTasks} open tasks while ${this.describeUser(lowest)} has ${lowest.openTasks}.`,
      category: 'ADMIN_WORKLOAD_IMBALANCE',
      actionUrl: `/admin/service-execution`,
      dedupeKey: `admin-workload-imbalance:${highest.id}:${lowest.id}:${adminUserId}`
    });
  }

  private async getAssignedMechanicIdsForBooking(bookingId: string): Promise<string[]> {
    const tasks = await this.prisma.serviceTask.findMany({
      where: {
        serviceOrder: {
          bookingId
        },
        assignedMechanicId: { not: null }
      },
      select: {
        assignedMechanicId: true
      }
    });

    return [...new Set(tasks.map((task) => task.assignedMechanicId).filter(Boolean) as string[])];
  }

  private async createNotification(input: NotificationCreateInput): Promise<void> {
    try {
      const notification = input.dedupeKey
        ? await this.prisma.appNotification.upsert({
            where: { dedupeKey: input.dedupeKey },
            update: {},
            create: {
              userId: input.userId,
              bookingId: input.bookingId,
              title: input.title,
              message: input.message,
              category: input.category,
              actionUrl: input.actionUrl,
              dedupeKey: input.dedupeKey,
              metadata: input.metadata
            }
          })
        : await this.prisma.appNotification.create({
            data: {
              userId: input.userId,
              bookingId: input.bookingId,
              title: input.title,
              message: input.message,
              category: input.category,
              actionUrl: input.actionUrl,
              metadata: input.metadata
            }
          });

      await this.deliveryHooks.queuePhaseTwoHooks({
        notificationId: notification.id,
        userId: input.userId,
        title: input.title,
        message: input.message,
        bookingId: input.bookingId
      });
    } catch {
      // Best-effort notification creation should not break operational workflows.
    }
  }

  private getCustomerStatusNotification(bookingId: string, nextStatus: BookingStatus) {
    const actionUrl = `/bookings/progress?bookingId=${bookingId}`;

    const map: Partial<
      Record<
        BookingStatus,
        {
          title: string;
          message: string;
          actionUrl: string;
        }
      >
    > = {
      CREATED: {
        title: 'Booking created',
        message: 'Your service booking has been created successfully.',
        actionUrl
      },
      PICKUP_ASSIGNED: {
        title: 'Pickup assigned',
        message: 'A pickup rider has been assigned for your motorcycle.',
        actionUrl
      },
      PICKED_UP: {
        title: 'Motorcycle picked up',
        message: 'Your motorcycle has been picked up and is on the way to the service center.',
        actionUrl
      },
      INSPECTION_COMPLETED: {
        title: 'Inspection completed',
        message: 'The initial inspection is complete and the findings are ready.',
        actionUrl
      },
      AWAITING_CUSTOMER_APPROVAL: {
        title: 'Approval required',
        message: 'Please review the inspection findings and approve the required work.',
        actionUrl: `/bookings/approval?bookingId=${bookingId}`
      },
      IN_SERVICE: {
        title: 'Service started',
        message: 'The service team has started work on your motorcycle.',
        actionUrl
      },
      READY_FOR_DELIVERY: {
        title: 'Service completed',
        message: 'Service work is complete and your motorcycle is being prepared for delivery.',
        actionUrl
      },
      OUT_FOR_DELIVERY: {
        title: 'Delivery started',
        message: 'Your motorcycle is now out for delivery.',
        actionUrl
      },
      DELIVERED: {
        title: 'Delivery completed',
        message: 'Your motorcycle has been delivered. Thank you for choosing MotoTrust.',
        actionUrl
      }
    };

    return map[nextStatus] ?? null;
  }

  private describeUser(user: { displayName: string | null; email: string | null; id: string }): string {
    return user.displayName ?? user.email ?? user.id;
  }

  private toResponse(notification: {
    id: string;
    title: string;
    message: string;
    category: string;
    bookingId: string | null;
    actionUrl: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      bookingId: notification.bookingId,
      actionUrl: notification.actionUrl,
      readAt: notification.readAt,
      isRead: Boolean(notification.readAt),
      createdAt: notification.createdAt
    };
  }
}
