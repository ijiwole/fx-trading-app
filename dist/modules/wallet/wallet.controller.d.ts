import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { TradeCurrencyDto } from './dto/trade-currency.dto';
interface RequestWithUser {
    user: {
        userId: string;
        email: string;
    };
}
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getWallets(req: RequestWithUser): Promise<{
        wallets: {
            id: string;
            currency: string;
            balance: number;
        }[];
    }>;
    fundWallet(req: RequestWithUser, fundWalletDto: FundWalletDto, idempotencyKey?: string): Promise<{
        message: string;
        transaction: {
            id: string;
            amount: number;
            currency: string;
            status: import("../transactions/entities/transaction.entity").TransactionStatus;
            createdAt: Date;
            idempotencyKey: string;
        };
    }>;
    convertCurrency(req: RequestWithUser, convertCurrencyDto: ConvertCurrencyDto, idempotencyKey?: string): Promise<{
        message: string;
        transaction: {
            id: string;
            sourceCurrency: string;
            sourceAmount: number;
            targetCurrency: string;
            targetAmount: number;
            rate: number;
            status: import("../transactions/entities/transaction.entity").TransactionStatus;
            createdAt: Date;
            idempotencyKey: string;
        };
    }>;
    tradeCurrency(req: RequestWithUser, tradeCurrencyDto: TradeCurrencyDto, idempotencyKey?: string): Promise<{
        message: string;
        transaction: {
            id: string;
            sourceCurrency: string;
            sourceAmount: number;
            targetCurrency: string;
            targetAmount: number;
            rate: number;
            status: import("../transactions/entities/transaction.entity").TransactionStatus;
            createdAt: Date;
            idempotencyKey: string;
        };
    }>;
}
export {};
