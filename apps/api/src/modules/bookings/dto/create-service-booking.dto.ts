import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { AddressInputDto } from './address-input.dto';

export class CreateServiceBookingDto {
  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsString()
  motorcycleId!: string;

  @ApiPropertyOptional({
    description: 'Optional. If absent, MotoTrust uses the lowest active fixed-price MVP package.'
  })
  @IsOptional()
  @IsString()
  servicePackageId?: string;

  @ApiProperty({ example: '2026-07-01T04:30:00.000Z' })
  @IsDateString()
  preferredPickupAt!: string;

  @ApiPropertyOptional({ example: 'Please call before pickup.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNotes?: string;

  @ApiProperty({ type: AddressInputDto })
  @ValidateNested()
  @Type(() => AddressInputDto)
  pickupAddress!: AddressInputDto;

  @ApiProperty({ type: AddressInputDto })
  @ValidateNested()
  @Type(() => AddressInputDto)
  dropAddress!: AddressInputDto;
}

