import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare enum TransactionType {
    FUNDING = "FUNDING",
    CONVERSION = "CONVERSION",
    TRADE = "TRADE"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class Transaction extends BaseEntity {
    user: User;
    userId: string;
    type: TransactionType;
    sourceCurrency: string;
    sourceAmount: number;
    targetCurrency: string;
    targetAmount: number;
    rate: number;
    status: TransactionStatus;
    reference: string;
    metadata: Record<string, any>;
    idempotencyKey: string;
    verified: boolean;
    verificationReference: string | null;
    verificationAttempts: number;
}
