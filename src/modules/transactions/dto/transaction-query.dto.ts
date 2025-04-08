import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';
import { Type } from 'class-transformer';

export class TransactionQueryDto {
  @ApiProperty({
    description: 'Number of transactions to return',
    default: 10,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Number of transactions to skip (for pagination)',
    default: 0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @ApiProperty({
    description: 'Filter transactions by type',
    enum: TransactionType,
    required: false,
    example: TransactionType.FUNDING,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
