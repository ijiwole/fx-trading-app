import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FxService } from '../fx/fx.service';
import { User } from '../users/entities/user.entity';
import { TransactionType } from '../transactions/entities/transaction.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly fxService: FxService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new admin user' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: 201,
    description: 'Admin user successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - invalid data or secret key',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already in use',
  })
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.createAdmin(
      createAdminDto.email!,
      createAdminDto.password!,
      createAdminDto.secretKey!,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of users to return (max 100)',
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of users to skip',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid pagination parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  async getAllUsers(@Query() query: PaginationDto) {
    try {
      const limit = query.limit || 20;
      const offset = query.offset || 0;

      if (limit > 100) {
        throw new BadRequestException(
          'Limit cannot exceed 100 users per request',
        );
      }

      const users = await this.usersService.findAll(limit, offset);

      const safeUsers = users.users.map((user: User) => ({
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt,
      }));

      return {
        success: true,
        users: safeUsers,
        total: users.total,
        limit,
        offset,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of transactions to return (max 100)',
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of transactions to skip',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid pagination parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  async getAllTransactions(@Query() query: PaginationDto) {
    try {
      const limit = query.limit || 20;
      const offset = query.offset || 0;

      if (limit > 100) {
        throw new BadRequestException(
          'Limit cannot exceed 100 transactions per request',
        );
      }

      const result = await this.transactionsService.findAll(limit, offset);

      return {
        success: true,
        transactions: result.transactions,
        total: result.total,
        limit,
        offset,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve transactions');
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('dashboard')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dashboard statistics and metrics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  async getDashboardData() {
    try {
      const userStats = await this.getUserStats();
      const transactionStats = await this.getTransactionStats();
      const fxRates = await this.fxService.getAllRates();

      return {
        success: true,
        stats: {
          users: userStats,
          transactions: transactionStats,
          fxRates: {
            lastUpdated: new Date(),
            rateCount: Object.keys(fxRates).length,
          },
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      throw new BadRequestException(
        'Failed to retrieve dashboard data: ' + errorMessage,
      );
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('fx/refresh-rates')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh FX rates cache' })
  @ApiResponse({
    status: 200,
    description: 'FX rates cache refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  async refreshFxRates() {
    try {
      await this.fxService.invalidateRatesCache();

      const newRates = await this.fxService.getAllRates();

      return {
        success: true,
        message: 'FX rates cache refreshed successfully',
        rateCount: Object.keys(newRates).length,
        timestamp: new Date(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      throw new BadRequestException(
        'Failed to refresh FX rates: ' + errorMessage,
      );
    }
  }

  private async getUserStats() {
    const allUsers = await this.usersService.findAll(1, 0);
    const verifiedUsersCount = await this.usersService.countVerifiedUsers();
    const adminUsersCount = await this.usersService.countAdminUsers();

    return {
      total: allUsers.total,
      verified: verifiedUsersCount,
      admins: adminUsersCount,
      registrationRate: {
        daily: await this.usersService.getRegistrationsInPeriod(1),
        weekly: await this.usersService.getRegistrationsInPeriod(7),
        monthly: await this.usersService.getRegistrationsInPeriod(30),
      },
    };
  }

  private async getTransactionStats() {
    const allTransactions = await this.transactionsService.findAll(1, 0);
    const transactionVolume = await this.calculateTransactionVolume();

    const fundingCount = await this.transactionsService.countByType(
      TransactionType.FUNDING,
    );
    const conversionCount = await this.transactionsService.countByType(
      TransactionType.CONVERSION,
    );
    const tradeCount = await this.transactionsService.countByType(
      TransactionType.TRADE,
    );

    return {
      total: allTransactions.total,
      volume: transactionVolume,
      byType: {
        funding: fundingCount,
        conversion: conversionCount,
        trade: tradeCount,
      },
      recentActivity: {
        daily: await this.transactionsService.getTransactionsInPeriod(1),
        weekly: await this.transactionsService.getTransactionsInPeriod(7),
      },
    };
  }

  private async calculateTransactionVolume() {
    const recentTransactions = await this.transactionsService.findAll(100, 0);

    const volumeByCurrency = {};

    for (const transaction of recentTransactions.transactions) {
      if (transaction.sourceCurrency) {
        if (!volumeByCurrency[transaction.sourceCurrency]) {
          volumeByCurrency[transaction.sourceCurrency] = 0;
        }
        volumeByCurrency[transaction.sourceCurrency] += Number(
          transaction.sourceAmount,
        );
      }

      if (transaction.targetCurrency) {
        if (!volumeByCurrency[transaction.targetCurrency]) {
          volumeByCurrency[transaction.targetCurrency] = 0;
        }
        volumeByCurrency[transaction.targetCurrency] += Number(
          transaction.targetAmount,
        );
      }
    }

    return volumeByCurrency;
  }
}
