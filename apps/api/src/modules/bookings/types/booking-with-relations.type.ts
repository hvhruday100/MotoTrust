import { Prisma } from '@prisma/client';

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    servicePackage: true;
    timelineEvents: true;
    proofMedia: {
      include: {
        uploadedBy: true;
      };
    };
  };
}>;
