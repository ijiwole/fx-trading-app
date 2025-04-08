import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    description: 'Number of items to return per page',
    default: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Number of items to skip (for pagination)',
    default: 0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  offset?: number;
}
