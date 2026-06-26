import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaProofType, MediaVisibility } from '@prisma/client';

export class ProofMediaResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bookingId!: string;

  @ApiPropertyOptional()
  inspectionIssueId?: string | null;

  @ApiPropertyOptional()
  serviceTaskId?: string | null;

  @ApiProperty({ enum: MediaProofType })
  type!: MediaProofType;

  @ApiProperty({ enum: MediaVisibility })
  visibility!: MediaVisibility;

  @ApiProperty()
  storageProvider!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiProperty()
  storageUrl!: string;

  @ApiPropertyOptional()
  mimeType?: string | null;

  @ApiPropertyOptional()
  fileName?: string | null;

  @ApiPropertyOptional()
  label?: string | null;

  @ApiPropertyOptional()
  caption?: string | null;

  @ApiPropertyOptional()
  capturedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  uploadedById?: string | null;

  @ApiPropertyOptional()
  uploadedByName?: string | null;
}
