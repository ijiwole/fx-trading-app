import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import { Wallet } from './entities/wallet.entity';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { FxService } from '../fx/fx.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { TradeCurrencyDto } from './dto/trade-currency.dto';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class WalletService {
  private readonly supportedCurrencies: string[];

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly fxService: FxService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly transactionsService: TransactionsService,
  ) {
    this.supportedCurrencies = this.configService.get<string[]>(
      'supportedCurrencies',
      ['NGN', 'USD', 'EUR', 'GBP'],
    );
  }

  async findUserWallets(userId: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { userId, isActive: true },
      order: { currency: 'ASC' },
    });
  }

  async getWalletBalance(userId: string, currency: string): Promise<number> {
    const wallet = await this.findOrCreateWallet(userId, currency);
    return wallet.balance;
  }

  async fundWallet(
    userId: string,
    fundWalletDto: FundWalletDto,
    idempotencyKey?: string,
  ): Promise<Transaction> {
    const { currency, amount } = fundWalletDto;

    if (!this.supportedCurrencies.includes(currency)) {
      throw new BadRequestException(`Currency ${currency} is not supported`);
    }

    if (idempotencyKey) {
      const existingTransaction =
        await this.transactionsService.findByIdempotencyKey(idempotencyKey);
      if (existingTransaction) {
        return existingTransaction;
      }
    }

    const transactionIdempotencyKey =
      idempotencyKey || `fund-${userId}-${currency}-${amount}-${uuidv4()}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await this.findOrCreateWallet(userId, currency);
      console.log('Wallet before update:', wallet);

      const transaction = await this.transactionsService.createWithIdempotency({
        userId,
        type: TransactionType.FUNDING,
        sourceCurrency: currency,
        sourceAmount: amount,
        targetCurrency: currency,
        targetAmount: amount,
        rate: 1,
        status: TransactionStatus.PENDING,
        reference: `FUND-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        idempotencyKey: transactionIdempotencyKey,
      });
      wallet.balance = Number(wallet.balance);
      wallet.balance += amount;
      await this.walletRepository.save(wallet);

      await this.transactionsService.verifyTransaction(
        transaction.id,
        'system_verified',
      );

      console.log('Wallet after update:', wallet);

      await queryRunner.commitTransaction();
      console.log('Transaction committed successfully');

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Failed to fund wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async convertCurrency(
    userId: string,
    convertCurrencyDto: ConvertCurrencyDto,
    idempotencyKey?: string,
  ): Promise<Transaction> {
    const { sourceCurrency, targetCurrency, amount } = convertCurrencyDto;

    if (sourceCurrency === targetCurrency) {
      throw new BadRequestException(
        'Source and target currencies cannot be the same',
      );
    }

    // Check if currencies are supported
    if (
      !this.supportedCurrencies.includes(sourceCurrency) ||
      !this.supportedCurrencies.includes(targetCurrency)
    ) {
      throw new BadRequestException('One or both currencies are not supported');
    }

    // Check for existing transaction with the same idempotency key
    if (idempotencyKey) {
      const existingTransaction =
        await this.transactionsService.findByIdempotencyKey(idempotencyKey);
      if (existingTransaction) {
        return existingTransaction;
      }
    }

    // Generate unique idempotency key if not provided
    const transactionIdempotencyKey =
      idempotencyKey ||
      `convert-${userId}-${sourceCurrency}-${targetCurrency}-${amount}-${uuidv4()}`;

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get exchange rate
      const rate = await this.fxService.getRate(sourceCurrency, targetCurrency);
      const targetAmount = amount * rate;

      // Find source wallet
      const sourceWallet = await this.findOrCreateWallet(
        userId,
        sourceCurrency,
      );

      // Check if source wallet has enough balance
      if (sourceWallet.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance in ${sourceCurrency} wallet`,
        );
      }

      // Find or create target wallet
      const targetWallet = await this.findOrCreateWallet(
        userId,
        targetCurrency,
      );

      // Create transaction record with idempotency key
      const transaction = await this.transactionsService.createWithIdempotency({
        userId,
        type: TransactionType.CONVERSION,
        sourceCurrency,
        sourceAmount: amount,
        targetCurrency,
        targetAmount,
        rate,
        status: TransactionStatus.PENDING,
        reference: `CONV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        idempotencyKey: transactionIdempotencyKey,
      });

      // Update wallet balances
      sourceWallet.balance -= amount;
      targetWallet.balance += targetAmount;

      await this.walletRepository.save(sourceWallet);
      await this.walletRepository.save(targetWallet);

      // Mark transaction as completed and verified
      await this.transactionsService.verifyTransaction(
        transaction.id,
        'system_verified',
      );

      // Commit transaction
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to convert currency: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async tradeCurrency(
    userId: string,
    tradeCurrencyDto: TradeCurrencyDto,
    idempotencyKey?: string,
  ): Promise<Transaction> {
    // Trading is similar to conversion but with different transaction type
    const { sourceCurrency, targetCurrency, amount } = tradeCurrencyDto;

    // Check if currencies are the same
    if (sourceCurrency === targetCurrency) {
      throw new BadRequestException(
        'Source and target currencies cannot be the same',
      );
    }

    // Check if currencies are supported
    if (
      !this.supportedCurrencies.includes(sourceCurrency) ||
      !this.supportedCurrencies.includes(targetCurrency)
    ) {
      throw new BadRequestException('One or both currencies are not supported');
    }

    // Check for existing transaction with the same idempotency key
    if (idempotencyKey) {
      const existingTransaction =
        await this.transactionsService.findByIdempotencyKey(idempotencyKey);
      if (existingTransaction) {
        return existingTransaction;
      }
    }

    // Generate unique idempotency key if not provided
    const transactionIdempotencyKey =
      idempotencyKey ||
      `trade-${userId}-${sourceCurrency}-${targetCurrency}-${amount}-${uuidv4()}`;

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get exchange rate
      const rate = await this.fxService.getRate(sourceCurrency, targetCurrency);
      const targetAmount = amount * rate;

      // Find source wallet
      const sourceWallet = await this.findOrCreateWallet(
        userId,
        sourceCurrency,
      );

      // Check if source wallet has enough balance
      if (sourceWallet.balance < amount) {
        throw new BadRequestException(
          `Insufficient balance in ${sourceCurrency} wallet`,
        );
      }

      // Find or create target wallet
      const targetWallet = await this.findOrCreateWallet(
        userId,
        targetCurrency,
      );

      // Create transaction record with idempotency key
      const transaction = await this.transactionsService.createWithIdempotency({
        userId,
        type: TransactionType.TRADE,
        sourceCurrency,
        sourceAmount: amount,
        targetCurrency,
        targetAmount,
        rate,
        status: TransactionStatus.PENDING,
        reference: `TRADE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        idempotencyKey: transactionIdempotencyKey,
      });

      // Update wallet balances
      sourceWallet.balance -= amount;
      targetWallet.balance += targetAmount;

      await this.walletRepository.save(sourceWallet);
      await this.walletRepository.save(targetWallet);

      // Mark transaction as completed and verified
      await this.transactionsService.verifyTransaction(
        transaction.id,
        'system_verified',
      );

      // Commit transaction
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to trade currency: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  private async findOrCreateWallet(
    userId: string,
    currency: string,
  ): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { userId, currency },
    });

    if (!wallet) {
      // Create new wallet for this currency
      wallet = this.walletRepository.create({
        userId,
        currency,
        balance: 0,
        isActive: true,
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }
}
