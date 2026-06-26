import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TASK_WORKFLOW_STATUSES, TaskWorkflowStatus } from '../service-execution.constants';

export class UpdateServiceTaskDto {
  @ApiPropertyOptional({ enum: TASK_WORKFLOW_STATUSES })
  @IsOptional()
  @IsIn(TASK_WORKFLOW_STATUSES)
  status?: TaskWorkflowStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedMechanicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  assignedMechanicName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
