import { Prisma } from '@prisma/client';

export type InspectionReportWithRelations = Prisma.InspectionReportGetPayload<{
  include: {
    issues: {
      include: {
        proofMedia: {
          include: {
            uploadedBy: true;
          };
        };
      };
    };
    booking: true;
  };
}>;
