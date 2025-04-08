import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransactionQueryDto } from './dto/transaction-query.dto';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

interface TransactionResponse {
  id: string;
  type: TransactionType;
  sourceCurrency: string;
  sourceAmount: number;
  targetCurrency: string;
  targetAmount: number;
  rate: number;
  status: string;
  reference: string;
  createdAt: Date;
}

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of transactions',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Invalid transaction type',
  })
  async getTransactions(
    @Req() req: RequestWithUser,
    @Query() query: TransactionQueryDto,
  ) {
    const userId = req.user.userId;
    const { limit = 10, offset = 0, type } = query;

    let result: { transactions: Transaction[]; total: number };

    if (type) {
      // Validate transaction type
      if (!Object.values(TransactionType).includes(type)) {
        throw new NotFoundException(`Invalid transaction type: ${type}`);
      }

      result = await this.transactionsService.findByType(
        userId,
        type,
        limit,
        offset,
      );
    } else {
      result = await this.transactionsService.findByUser(userId, limit, offset);
    }

    const transactions: TransactionResponse[] = result.transactions.map(
      (tx) => ({
        id: tx.id,
        type: tx.type,
        sourceCurrency: tx.sourceCurrency || '',
        sourceAmount: tx.sourceAmount,
        targetCurrency: tx.targetCurrency || '',
        targetAmount: tx.targetAmount,
        rate: tx.rate || 0,
        status: tx.status,
        reference: tx.reference || '',
        createdAt: tx.createdAt,
      }),
    );

    return {
      transactions,
      total: result.total,
      limit,
      offset,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the transaction details',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Transaction not found',
  })
  async getTransaction(@Req() req: RequestWithUser, @Param('id') id: string) {
    const transaction = await this.transactionsService.findById(
      id,
      req.user.userId,
    );

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return {
      transaction: {
        id: transaction.id,
        type: transaction.type,
        sourceCurrency: transaction.sourceCurrency,
        sourceAmount: transaction.sourceAmount,
        targetCurrency: transaction.targetCurrency,
        targetAmount: transaction.targetAmount,
        rate: transaction.rate,
        status: transaction.status,
        reference: transaction.reference,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        metadata: transaction.metadata,
      },
    };
  }
}
