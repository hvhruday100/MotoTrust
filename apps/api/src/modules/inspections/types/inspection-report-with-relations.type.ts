import { Prisma } from '@prisma/client';

export type InspectionReportWithRelations = Prisma.InspectionReportGetPayload<{
  include: {
    issues: true;
    booking: true;
  };
}>;

