import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Email address for the admin account',
    example: 'admin@example.com',
  })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Password for the admin account',
    example: 'StrongPassword123!',
    minLength: 8,
  })
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Secret key required to create admin accounts',
    example: 'admin-secret-key-change-in-production',
  })
  @IsOptional()
  secretKey?: string;
}
