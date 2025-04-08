import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { FxService } from '../fx/fx.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { TradeCurrencyDto } from './dto/trade-currency.dto';
import { TransactionsService } from '../transactions/transactions.service';
export declare class WalletService {
    private readonly walletRepository;
    private readonly transactionRepository;
    private readonly fxService;
    private readonly configService;
    private readonly dataSource;
    private readonly transactionsService;
    private readonly supportedCurrencies;
    constructor(walletRepository: Repository<Wallet>, transactionRepository: Repository<Transaction>, fxService: FxService, configService: ConfigService, dataSource: DataSource, transactionsService: TransactionsService);
    findUserWallets(userId: string): Promise<Wallet[]>;
    getWalletBalance(userId: string, currency: string): Promise<number>;
    fundWallet(userId: string, fundWalletDto: FundWalletDto, idempotencyKey?: string): Promise<Transaction>;
    convertCurrency(userId: string, convertCurrencyDto: ConvertCurrencyDto, idempotencyKey?: string): Promise<Transaction>;
    tradeCurrency(userId: string, tradeCurrencyDto: TradeCurrencyDto, idempotencyKey?: string): Promise<Transaction>;
    private findOrCreateWallet;
}
