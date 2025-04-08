import { TransactionsService } from './transactions.service';
import { TransactionType } from './entities/transaction.entity';
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
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    getTransactions(req: RequestWithUser, query: TransactionQueryDto): Promise<{
        transactions: TransactionResponse[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getTransaction(req: RequestWithUser, id: string): Promise<{
        transaction: {
            id: string;
            type: TransactionType;
            sourceCurrency: string;
            sourceAmount: number;
            targetCurrency: string;
            targetAmount: number;
            rate: number;
            status: import("./entities/transaction.entity").TransactionStatus;
            reference: string;
            createdAt: Date;
            updatedAt: Date;
            metadata: Record<string, any>;
        };
    }>;
}
export {};
