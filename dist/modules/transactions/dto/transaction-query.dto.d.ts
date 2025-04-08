import { TransactionType } from '../entities/transaction.entity';
export declare class TransactionQueryDto {
    limit?: number;
    offset?: number;
    type?: TransactionType;
}
