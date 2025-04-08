import { IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FundWalletDto {
  @ApiProperty({
    description: 'Currency code for the wallet',
    enum: ['NGN', 'USD', 'EUR', 'GBP'],
    example: 'USD',
  })
  @IsString()
  @IsIn(['NGN', 'USD', 'EUR', 'GBP'], {
    message: 'Currency must be one of NGN, USD, EUR, GBP',
  })
  currency: string;

  @ApiProperty({
    description: 'Amount to fund the wallet with',
    minimum: 0.01,
    example: 100.5,
  })
  @IsNumber(
    { maxDecimalPlaces: 8 },
    { message: 'Amount must be a number with at most 8 decimal places' },
  )
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;
}
