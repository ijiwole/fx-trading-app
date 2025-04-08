import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { TradeCurrencyDto } from './dto/trade-currency.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wallets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of user wallets',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async getWallets(@Req() req: RequestWithUser) {
    const wallets = await this.walletService.findUserWallets(req.user.userId);

    return {
      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        currency: wallet.currency,
        balance: wallet.balance,
      })),
    };
  }

  @Post('fund')
  @ApiOperation({ summary: 'Fund a wallet with specified currency and amount' })
  @ApiBody({ type: FundWalletDto })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Unique key to prevent duplicate funding operations',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Wallet funded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async fundWallet(
    @Req() req: RequestWithUser,
    @Body() fundWalletDto: FundWalletDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const transaction = await this.walletService.fundWallet(
      req.user.userId,
      fundWalletDto,
      idempotencyKey,
    );

    return {
      message: 'Wallet funded successfully',
      transaction: {
        id: transaction.id,
        amount: transaction.sourceAmount,
        currency: transaction.sourceCurrency,
        status: transaction.status,
        createdAt: transaction.createdAt,
        idempotencyKey: transaction.idempotencyKey,
      },
    };
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert funds from one currency to another' })
  @ApiBody({ type: ConvertCurrencyDto })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Unique key to prevent duplicate conversion operations',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Currency converted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data or insufficient funds',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async convertCurrency(
    @Req() req: RequestWithUser,
    @Body() convertCurrencyDto: ConvertCurrencyDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const transaction = await this.walletService.convertCurrency(
      req.user.userId,
      convertCurrencyDto,
      idempotencyKey,
    );

    return {
      message: 'Currency converted successfully',
      transaction: {
        id: transaction.id,
        sourceCurrency: transaction.sourceCurrency,
        sourceAmount: transaction.sourceAmount,
        targetCurrency: transaction.targetCurrency,
        targetAmount: transaction.targetAmount,
        rate: transaction.rate,
        status: transaction.status,
        createdAt: transaction.createdAt,
        idempotencyKey: transaction.idempotencyKey,
      },
    };
  }

  @Post('trade')
  @ApiOperation({ summary: 'Execute a trade between two currencies' })
  @ApiBody({ type: TradeCurrencyDto })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Unique key to prevent duplicate trade operations',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Currency traded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data or insufficient funds',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async tradeCurrency(
    @Req() req: RequestWithUser,
    @Body() tradeCurrencyDto: TradeCurrencyDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const transaction = await this.walletService.tradeCurrency(
      req.user.userId,
      tradeCurrencyDto,
      idempotencyKey,
    );

    return {
      message: 'Currency traded successfully',
      transaction: {
        id: transaction.id,
        sourceCurrency: transaction.sourceCurrency,
        sourceAmount: transaction.sourceAmount,
        targetCurrency: transaction.targetCurrency,
        targetAmount: transaction.targetAmount,
        rate: transaction.rate,
        status: transaction.status,
        createdAt: transaction.createdAt,
        idempotencyKey: transaction.idempotencyKey,
      },
    };
  }
}
