import { IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertCurrencyDto {
  @ApiProperty({
    description: 'Source currency to convert from',
    enum: ['NGN', 'USD', 'EUR', 'GBP'],
    example: 'USD',
  })
  @IsString()
  @IsIn(['NGN', 'USD', 'EUR', 'GBP'], {
    message: 'Source currency must be one of NGN, USD, EUR, GBP',
  })
  sourceCurrency: string;

  @ApiProperty({
    description: 'Target currency to convert to',
    enum: ['NGN', 'USD', 'EUR', 'GBP'],
    example: 'EUR',
  })
  @IsString()
  @IsIn(['NGN', 'USD', 'EUR', 'GBP'], {
    message: 'Target currency must be one of NGN, USD, EUR, GBP',
  })
  targetCurrency: string;

  @ApiProperty({
    description: 'Amount to convert from source currency',
    minimum: 0.01,
    example: 100.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 8 },
    { message: 'Amount must be a number with at most 8 decimal places' },
  )
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;
}
