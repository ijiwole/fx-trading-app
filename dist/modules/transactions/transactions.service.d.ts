import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
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
export declare class TransactionsService {
    private readonly transactionRepository;
    constructor(transactionRepository: Repository<Transaction>);
    findByUser(userId: string, limit?: number, offset?: number): Promise<{
        transactions: Transaction[];
        total: number;
    }>;
    findByType(userId: string, type: TransactionType, limit?: number, offset?: number): Promise<{
        transactions: Transaction[];
        total: number;
    }>;
    findById(id: string, userId: string): Promise<Transaction | null>;
    findAll(limit?: number, offset?: number): Promise<{
        transactions: Transaction[];
        total: number;
    }>;
    findByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null>;
    createWithIdempotency(params: CreateTransactionParams): Promise<Transaction>;
    verifyTransaction(id: string, verificationReference?: string): Promise<Transaction>;
    countByType(type: TransactionType): Promise<number>;
    getTransactionsInPeriod(days: number): Promise<number>;
}
export {};
