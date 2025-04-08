import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';
import { v4 as uuidv4 } from 'uuid';

interface CreateTransactionParams {
  userId: string;
  type: TransactionType;
  sourceCurrency?: string;
  sourceAmount?: number;
  targetCurrency?: string;
  targetAmount?: number;
  rate?: number;
  reference?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  status?: TransactionStatus;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findByUser(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      },
    );

    return { transactions, total };
  }

  async findByType(
    userId: string,
    type: TransactionType,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: { userId, type },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      },
    );

    return { transactions, total };
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id, userId },
    });
  }

  async findAll(
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      },
    );

    return { transactions, total };
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { idempotencyKey },
    });
  }

  async createWithIdempotency(
    params: CreateTransactionParams,
  ): Promise<Transaction> {
    const { idempotencyKey = uuidv4(), ...transactionData } = params;

    const existingTransaction = await this.findByIdempotencyKey(idempotencyKey);
    if (existingTransaction) {
      return existingTransaction;
    }

    const transaction = this.transactionRepository.create({
      ...transactionData,
      idempotencyKey,
    });

    return this.transactionRepository.save(transaction);
  }

  async verifyTransaction(
    id: string,
    verificationReference?: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    transaction.verified = true;
    transaction.verificationReference = verificationReference || null;
    transaction.verificationAttempts += 1;

    if (transaction.status === TransactionStatus.PENDING) {
      transaction.status = TransactionStatus.COMPLETED;
    }

    return this.transactionRepository.save(transaction);
  }

  async countByType(type: TransactionType): Promise<number> {
    return this.transactionRepository.count({
      where: { type },
    });
  }

  async getTransactionsInPeriod(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.transactionRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date),
      },
    });
  }
}
