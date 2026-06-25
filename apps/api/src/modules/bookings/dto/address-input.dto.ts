import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPostalCode, IsString, MaxLength, MinLength } from 'class-validator';

export class AddressInputDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  label!: string;

  @ApiProperty({ example: '12 MG Road' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  line1!: string;

  @ApiPropertyOptional({ example: 'Near Metro Station' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  line2?: string;

  @ApiProperty({ example: 'Bengaluru' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  state!: string;

  @ApiProperty({ example: '560001' })
  @IsPostalCode('IN')
  pincode!: string;
}

