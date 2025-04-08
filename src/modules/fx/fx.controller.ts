import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FxService } from './fx.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('fx')
@Controller('fx')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get all available FX rates' })
  @ApiResponse({
    status: 200,
    description: 'Returns all available exchange rates',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async getAllRates() {
    return {
      rates: await this.fxService.getAllRates(),
    };
  }

  @Get('rates/:from/:to')
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiParam({
    name: 'from',
    description: 'Source currency code (e.g., USD)',
    example: 'USD',
  })
  @ApiParam({
    name: 'to',
    description: 'Target currency code (e.g., EUR)',
    example: 'EUR',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the exchange rate between two currencies',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid currency codes',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async getRate(@Param('from') from: string, @Param('to') to: string) {
    const rate = await this.fxService.getRate(
      from.toUpperCase(),
      to.toUpperCase(),
    );

    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
    };
  }
}
