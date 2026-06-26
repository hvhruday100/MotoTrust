import { MediaProofType, MediaVisibility } from '@prisma/client';
import { ProofMediaResponseDto } from './dto/proof-media-response.dto';

type ProofMediaAssetLike = {
  id: string;
  bookingId: string;
  inspectionIssueId: string | null;
  serviceTaskId: string | null;
  uploadedById: string | null;
  type: MediaProofType;
  visibility: MediaVisibility;
  storageProvider: string;
  storageKey: string;
  storageUrl: string;
  mimeType: string | null;
  fileName: string | null;
  label: string | null;
  caption: string | null;
  capturedAt: Date | null;
  createdAt: Date;
  uploadedBy?: {
    id: string;
    displayName: string | null;
    email: string | null;
    firebaseUid: string;
  } | null;
};

export function toProofMediaResponse(asset: ProofMediaAssetLike): ProofMediaResponseDto {
  return {
    id: asset.id,
    bookingId: asset.bookingId,
    inspectionIssueId: asset.inspectionIssueId,
    serviceTaskId: asset.serviceTaskId,
    uploadedById: asset.uploadedById,
    uploadedByName:
      asset.uploadedBy?.displayName ?? asset.uploadedBy?.email ?? asset.uploadedBy?.firebaseUid ?? null,
    type: asset.type,
    visibility: asset.visibility,
    storageProvider: asset.storageProvider,
    storageKey: asset.storageKey,
    storageUrl: asset.storageUrl,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
    label: asset.label,
    caption: asset.caption,
    capturedAt: asset.capturedAt,
    createdAt: asset.createdAt
  };
}

export function sortProofMediaChronologically<T extends { capturedAt: Date | null; createdAt: Date }>(
  items: T[]
): T[] {
  return [...items].sort((left, right) => {
    const leftTime = (left.capturedAt ?? left.createdAt).getTime();
    const rightTime = (right.capturedAt ?? right.createdAt).getTime();
    return leftTime - rightTime;
  });
}
