import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, ServiceOrderStatus, ServiceTaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { DEFAULT_SERVICE_TASKS, TaskWorkflowStatus } from './service-execution.constants';
import { AddServiceTaskPartDto } from './dto/add-service-task-part.dto';
import { ServiceExecutionResponseDto } from './dto/service-execution-response.dto';
import { ServicePartUsageResponseDto } from './dto/service-part-usage-response.dto';
import { ServiceTaskResponseDto } from './dto/service-task-response.dto';
import { UpdateServiceTaskDto } from './dto/update-service-task.dto';

type TransactionClient = Prisma.TransactionClient;

type ServiceExecutionPayload = Prisma.ServiceOrderGetPayload<{
  include: {
    booking: true;
    tasks: {
      include: {
        partsUsed: {
          include: {
            part: true;
          };
        };
      };
    };
  };
}>;

type ServiceTaskPayload = Prisma.ServiceTaskGetPayload<{
  include: {
    serviceOrder: {
      include: {
        booking: true;
      };
    };
    partsUsed: {
      include: {
        part: true;
      };
    };
  };
}>;

@Injectable()
export class ServiceExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async initializeForBookingInService(tx: TransactionClient, bookingId: string): Promise<void> {
    const existing = await tx.serviceOrder.findUnique({
      where: { bookingId },
      include: { tasks: true }
    });

    if (!existing) {
      await tx.serviceOrder.create({
        data: {
          bookingId,
          status: ServiceOrderStatus.IN_SERVICE,
          startedAt: new Date(),
          tasks: {
            create: DEFAULT_SERVICE_TASKS.map((task) => ({
              name: task.name,
              description: task.description,
              status: ServiceTaskStatus.PENDING
            }))
          }
        }
      });
      return;
    }

    const existingNames = new Set(existing.tasks.map((task) => task.name));
    const missingTasks = DEFAULT_SERVICE_TASKS.filter((task) => !existingNames.has(task.name));

    await tx.serviceOrder.update({
      where: { id: existing.id },
      data: {
        status: ServiceOrderStatus.IN_SERVICE,
        startedAt: existing.startedAt ?? new Date(),
        tasks: missingTasks.length
          ? {
              create: missingTasks.map((task) => ({
                name: task.name,
                description: task.description,
                status: ServiceTaskStatus.PENDING
              }))
            }
          : undefined
      }
    });
  }

  async getByBookingId(bookingId: string, user: AuthenticatedAppUser): Promise<ServiceExecutionResponseDto> {
    let serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { bookingId },
      include: {
        booking: true,
        tasks: {
          include: {
            partsUsed: {
              include: {
                part: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!serviceOrder) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, status: true }
      });

      if (!booking) {
        throw new NotFoundException('Booking not found.');
      }

      if (booking.status === BookingStatus.IN_SERVICE) {
        await this.prisma.$transaction(async (tx) => {
          await this.initializeForBookingInService(tx, bookingId);
        });

        serviceOrder = await this.prisma.serviceOrder.findUnique({
          where: { bookingId },
          include: {
            booking: true,
            tasks: {
              include: {
                partsUsed: {
                  include: {
                    part: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        });
      }
    }

    if (!serviceOrder) {
      throw new NotFoundException('Service execution workflow has not started for this booking.');
    }

    this.assertBookingAccess(serviceOrder.booking.customerId, user);

    return this.toExecutionResponse(serviceOrder);
  }

  async getAssignedTasks(mechanicId: string, user: AuthenticatedAppUser): Promise<ServiceTaskResponseDto[]> {
    if (user.role === 'MECHANIC' && user.id !== mechanicId) {
      throw new ForbiddenException('Mechanics can only view tasks assigned to themselves.');
    }

    const tasks = await this.prisma.serviceTask.findMany({
      where: { assignedMechanicId: mechanicId.trim() },
      include: {
        serviceOrder: {
          include: {
            booking: true
          }
        },
        partsUsed: {
          include: {
            part: true
          }
        }
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }]
    });

    return tasks.map((task) => this.toTaskResponse(task));
  }

  async updateTask(taskId: string, dto: UpdateServiceTaskDto, user: AuthenticatedAppUser): Promise<ServiceTaskResponseDto> {
    const task = await this.prisma.serviceTask.findUnique({
      where: { id: taskId },
      include: {
        serviceOrder: {
          include: {
            booking: true
          }
        },
        partsUsed: {
          include: {
            part: true
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Service task not found.');
    }

    this.assertTaskMutationAccess(task.assignedMechanicId, user);

    const actor = this.authService.toTimelineActor(user);
    const currentStatus = this.normalizeTaskStatus(task.status);
    const requestedStatus = dto.status ?? currentStatus;
    const nextAssignedMechanicId = this.normalizeNullableString(dto.assignedMechanicId);
    const nextAssignedMechanicName = this.normalizeNullableString(dto.assignedMechanicName);
    const nextNotes = this.normalizeNullableString(dto.notes);

    if (dto.status && dto.status !== currentStatus) {
      this.assertStatusTransitionAllowed(currentStatus, dto.status);
      this.assertBookingInService(task.serviceOrder.booking.status, 'start or complete service tasks');
    }

    const assignmentChanged =
      nextAssignedMechanicId !== (task.assignedMechanicId ?? null) ||
      nextAssignedMechanicName !== (task.assignedMechanicName ?? null);
    const notesChanged = dto.notes !== undefined && nextNotes !== (task.notes ?? null);
    const statusChanged = dto.status !== undefined && requestedStatus !== currentStatus;

    if (!assignmentChanged && !notesChanged && !statusChanged) {
      return this.toTaskResponse(task);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextStartedAt =
        requestedStatus === 'IN_PROGRESS' || requestedStatus === 'COMPLETED' ? task.startedAt ?? new Date() : task.startedAt;
      const nextCompletedAt = requestedStatus === 'COMPLETED' ? task.completedAt ?? new Date() : null;

      const saved = await tx.serviceTask.update({
        where: { id: taskId },
        data: {
          status: this.toPrismaTaskStatus(requestedStatus),
          assignedMechanicId: dto.assignedMechanicId !== undefined ? nextAssignedMechanicId : task.assignedMechanicId,
          assignedMechanicName:
            dto.assignedMechanicName !== undefined ? nextAssignedMechanicName : task.assignedMechanicName,
          notes: dto.notes !== undefined ? nextNotes : task.notes,
          startedAt: nextStartedAt,
          completedAt: nextCompletedAt
        },
        include: {
          serviceOrder: {
            include: {
              booking: true
            }
          },
          partsUsed: {
            include: {
              part: true
            }
          }
        }
      });

      const timelineEvents: Prisma.BookingTimelineEventCreateManyInput[] = [];

      if (assignmentChanged) {
        timelineEvents.push({
          bookingId: task.serviceOrder.bookingId,
          fromStatus: task.serviceOrder.booking.status,
          toStatus: task.serviceOrder.booking.status,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note: nextAssignedMechanicName
            ? `Assigned task "${task.name}" to ${nextAssignedMechanicName}.`
            : `Cleared mechanic assignment for task "${task.name}".`,
          metadata: {
            action: 'SERVICE_TASK_ASSIGNED',
            taskId: task.id,
            taskName: task.name,
            assignedMechanicId: nextAssignedMechanicId,
            assignedMechanicName: nextAssignedMechanicName
          }
        });
      }

      if (notesChanged) {
        timelineEvents.push({
          bookingId: task.serviceOrder.bookingId,
          fromStatus: task.serviceOrder.booking.status,
          toStatus: task.serviceOrder.booking.status,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note: `Updated notes for task "${task.name}".`,
          metadata: {
            action: 'SERVICE_TASK_NOTE_UPDATED',
            taskId: task.id,
            taskName: task.name
          }
        });
      }

      if (statusChanged) {
        timelineEvents.push({
          bookingId: task.serviceOrder.bookingId,
          fromStatus: task.serviceOrder.booking.status,
          toStatus: task.serviceOrder.booking.status,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note: `Task "${task.name}" moved from ${this.toLabel(currentStatus)} to ${this.toLabel(requestedStatus)}.`,
          metadata: {
            action: 'SERVICE_TASK_STATUS_CHANGED',
            taskId: task.id,
            taskName: task.name,
            previousStatus: currentStatus,
            nextStatus: requestedStatus
          }
        });
      }

      if (timelineEvents.length) {
        await tx.bookingTimelineEvent.createMany({ data: timelineEvents });
      }

      return saved;
    });

    return this.toTaskResponse(updated);
  }

  async addPartUsage(taskId: string, dto: AddServiceTaskPartDto, user: AuthenticatedAppUser): Promise<ServiceTaskResponseDto> {
    const task = await this.prisma.serviceTask.findUnique({
      where: { id: taskId },
      include: {
        serviceOrder: {
          include: {
            booking: true
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Service task not found.');
    }

    this.assertBookingInService(task.serviceOrder.booking.status, 'record parts usage');
    this.assertTaskMutationAccess(task.assignedMechanicId, user);

    const actor = this.authService.toTimelineActor(user);

    const updated = await this.prisma.$transaction(async (tx) => {
      const part = await tx.part.upsert({
        where: { sku: dto.sku.trim() },
        update: {
          name: dto.name.trim(),
          manufacturer: dto.manufacturer.trim(),
          isGenuine: dto.isGenuine ?? true,
          mrp: new Prisma.Decimal(dto.unitPrice)
        },
        create: {
          sku: dto.sku.trim(),
          name: dto.name.trim(),
          manufacturer: dto.manufacturer.trim(),
          isGenuine: dto.isGenuine ?? true,
          mrp: new Prisma.Decimal(dto.unitPrice)
        }
      });

      await tx.serviceOrderPart.create({
        data: {
          serviceOrderId: task.serviceOrderId,
          serviceTaskId: task.id,
          partId: part.id,
          quantity: dto.quantity,
          unitPrice: new Prisma.Decimal(dto.unitPrice),
          batchCode: dto.batchCode?.trim(),
          verifiedAt: new Date()
        }
      });

      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: task.serviceOrder.bookingId,
          fromStatus: task.serviceOrder.booking.status,
          toStatus: task.serviceOrder.booking.status,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note: `Recorded part usage for task "${task.name}": ${dto.name.trim()} x${dto.quantity}.`,
          metadata: {
            action: 'SERVICE_TASK_PART_USED',
            taskId: task.id,
            taskName: task.name,
            sku: dto.sku.trim(),
            quantity: dto.quantity,
            unitPrice: dto.unitPrice
          }
        }
      });

      return tx.serviceTask.findUniqueOrThrow({
        where: { id: task.id },
        include: {
          serviceOrder: {
            include: {
              booking: true
            }
          },
          partsUsed: {
            include: {
              part: true
            }
          }
        }
      });
    });

    return this.toTaskResponse(updated);
  }

  private assertBookingInService(status: BookingStatus, action: string): void {
    if (status !== BookingStatus.IN_SERVICE) {
      throw new BadRequestException(`Booking must be IN_SERVICE before you can ${action}.`);
    }
  }

  private assertBookingAccess(customerId: string, user: AuthenticatedAppUser): void {
    if (user.role === 'CUSTOMER' && user.customerProfileId !== customerId) {
      throw new ForbiddenException('You can only view service execution for your own booking.');
    }
  }

  private assertTaskMutationAccess(assignedMechanicId: string | null, user: AuthenticatedAppUser): void {
    if (user.role === 'MECHANIC' && assignedMechanicId && assignedMechanicId !== user.id) {
      throw new ForbiddenException('Mechanics can only update tasks assigned to themselves.');
    }
  }

  private assertStatusTransitionAllowed(current: TaskWorkflowStatus, next: TaskWorkflowStatus): void {
    const allowedTransitions: Record<TaskWorkflowStatus, TaskWorkflowStatus[]> = {
      PENDING: ['IN_PROGRESS', 'COMPLETED'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: []
    };

    if (current === next) {
      return;
    }

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(`Task transition from ${current} to ${next} is not allowed.`);
    }
  }

  private normalizeTaskStatus(status: ServiceTaskStatus): TaskWorkflowStatus {
    if (status === ServiceTaskStatus.IN_PROGRESS) {
      return 'IN_PROGRESS';
    }

    if (status === ServiceTaskStatus.PENDING) {
      return 'PENDING';
    }

    return 'COMPLETED';
  }

  private toPrismaTaskStatus(status: TaskWorkflowStatus): ServiceTaskStatus {
    switch (status) {
      case 'PENDING':
        return ServiceTaskStatus.PENDING;
      case 'IN_PROGRESS':
        return ServiceTaskStatus.IN_PROGRESS;
      default:
        return ServiceTaskStatus.COMPLETED;
    }
  }

  private toExecutionResponse(serviceOrder: ServiceExecutionPayload): ServiceExecutionResponseDto {
    return {
      bookingId: serviceOrder.bookingId,
      bookingStatus: serviceOrder.booking.status,
      serviceOrderId: serviceOrder.id,
      serviceOrderStatus: serviceOrder.status,
      startedAt: serviceOrder.startedAt,
      completedAt: serviceOrder.completedAt,
      tasks: serviceOrder.tasks.map((task) => ({
        id: task.id,
        serviceOrderId: task.serviceOrderId,
        bookingId: serviceOrder.bookingId,
        bookingStatus: serviceOrder.booking.status,
        name: task.name,
        description: task.description,
        status: this.normalizeTaskStatus(task.status),
        assignedMechanicId: task.assignedMechanicId,
        assignedMechanicName: task.assignedMechanicName,
        notes: task.notes,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        partsUsed: task.partsUsed.map((partUsage) => this.toPartUsageResponse(partUsage))
      }))
    };
  }

  private toTaskResponse(task: ServiceTaskPayload): ServiceTaskResponseDto {
    return {
      id: task.id,
      serviceOrderId: task.serviceOrderId,
      bookingId: task.serviceOrder.bookingId,
      bookingStatus: task.serviceOrder.booking.status,
      name: task.name,
      description: task.description,
      status: this.normalizeTaskStatus(task.status),
      assignedMechanicId: task.assignedMechanicId,
      assignedMechanicName: task.assignedMechanicName,
      notes: task.notes,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      partsUsed: task.partsUsed.map((partUsage) => this.toPartUsageResponse(partUsage))
    };
  }

  private toPartUsageResponse(partUsage: {
    id: string;
    partId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    batchCode: string | null;
    verifiedAt: Date | null;
    part: {
      sku: string;
      name: string;
      manufacturer: string;
    };
  }): ServicePartUsageResponseDto {
    const unitPrice = partUsage.unitPrice.toNumber();

    return {
      id: partUsage.id,
      partId: partUsage.partId,
      sku: partUsage.part.sku,
      name: partUsage.part.name,
      manufacturer: partUsage.part.manufacturer,
      quantity: partUsage.quantity,
      unitPrice,
      totalPrice: unitPrice * partUsage.quantity,
      batchCode: partUsage.batchCode,
      verifiedAt: partUsage.verifiedAt
    };
  }

  private toLabel(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  private normalizeNullableString(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}
