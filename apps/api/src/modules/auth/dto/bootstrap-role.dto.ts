import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class BootstrapRoleDto {
  @ApiProperty({ example: 'ops@mototrust.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.MECHANIC] })
  @IsEnum(UserRole)
  role!: UserRole;
}
