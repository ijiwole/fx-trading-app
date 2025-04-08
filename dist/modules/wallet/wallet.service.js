"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const wallet_entity_1 = require("./entities/wallet.entity");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const fx_service_1 = require("../fx/fx.service");
const transactions_service_1 = require("../transactions/transactions.service");
let WalletService = class WalletService {
    walletRepository;
    transactionRepository;
    fxService;
    configService;
    dataSource;
    transactionsService;
    supportedCurrencies;
    constructor(walletRepository, transactionRepository, fxService, configService, dataSource, transactionsService) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.fxService = fxService;
        this.configService = configService;
        this.dataSource = dataSource;
        this.transactionsService = transactionsService;
        this.supportedCurrencies = this.configService.get('supportedCurrencies', ['NGN', 'USD', 'EUR', 'GBP']);
    }
    async findUserWallets(userId) {
        return this.walletRepository.find({
            where: { userId, isActive: true },
            order: { currency: 'ASC' },
        });
    }
    async getWalletBalance(userId, currency) {
        const wallet = await this.findOrCreateWallet(userId, currency);
        return wallet.balance;
    }
    async fundWallet(userId, fundWalletDto, idempotencyKey) {
        const { currency, amount } = fundWalletDto;
        if (!this.supportedCurrencies.includes(currency)) {
            throw new common_1.BadRequestException(`Currency ${currency} is not supported`);
        }
        if (idempotencyKey) {
            const existingTransaction = await this.transactionsService.findByIdempotencyKey(idempotencyKey);
            if (existingTransaction) {
                return existingTransaction;
            }
        }
        const transactionIdempotencyKey = idempotencyKey || `fund-${userId}-${currency}-${amount}-${(0, uuid_1.v4)()}`;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const wallet = await this.findOrCreateWallet(userId, currency);
            console.log('Wallet before update:', wallet);
            const transaction = await this.transactionsService.createWithIdempotency({
                userId,
                type: transaction_entity_1.TransactionType.FUNDING,
                sourceCurrency: currency,
                sourceAmount: amount,
                targetCurrency: currency,
                targetAmount: amount,
                rate: 1,
                status: transaction_entity_1.TransactionStatus.PENDING,
                reference: `FUND-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                idempotencyKey: transactionIdempotencyKey,
            });
            wallet.balance = Number(wallet.balance);
            wallet.balance += amount;
            await this.walletRepository.save(wallet);
            await this.transactionsService.verifyTransaction(transaction.id, 'system_verified');
            console.log('Wallet after update:', wallet);
            await queryRunner.commitTransaction();
            console.log('Transaction committed successfully');
            return transaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw new common_1.InternalServerErrorException(`Failed to fund wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            await queryRunner.release();
        }
    }
    async convertCurrency(userId, convertCurrencyDto, idempotencyKey) {
        const { sourceCurrency, targetCurrency, amount } = convertCurrencyDto;
        if (sourceCurrency === targetCurrency) {
            throw new common_1.BadRequestException('Source and target currencies cannot be the same');
        }
        if (!this.supportedCurrencies.includes(sourceCurrency) ||
            !this.supportedCurrencies.includes(targetCurrency)) {
            throw new common_1.BadRequestException('One or both currencies are not supported');
        }
        if (idempotencyKey) {
            const existingTransaction = await this.transactionsService.findByIdempotencyKey(idempotencyKey);
            if (existingTransaction) {
                return existingTransaction;
            }
        }
        const transactionIdempotencyKey = idempotencyKey ||
            `convert-${userId}-${sourceCurrency}-${targetCurrency}-${amount}-${(0, uuid_1.v4)()}`;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const rate = await this.fxService.getRate(sourceCurrency, targetCurrency);
            const targetAmount = amount * rate;
            const sourceWallet = await this.findOrCreateWallet(userId, sourceCurrency);
            if (sourceWallet.balance < amount) {
                throw new common_1.BadRequestException(`Insufficient balance in ${sourceCurrency} wallet`);
            }
            const targetWallet = await this.findOrCreateWallet(userId, targetCurrency);
            const transaction = await this.transactionsService.createWithIdempotency({
                userId,
                type: transaction_entity_1.TransactionType.CONVERSION,
                sourceCurrency,
                sourceAmount: amount,
                targetCurrency,
                targetAmount,
                rate,
                status: transaction_entity_1.TransactionStatus.PENDING,
                reference: `CONV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                idempotencyKey: transactionIdempotencyKey,
            });
            sourceWallet.balance -= amount;
            targetWallet.balance += targetAmount;
            await this.walletRepository.save(sourceWallet);
            await this.walletRepository.save(targetWallet);
            await this.transactionsService.verifyTransaction(transaction.id, 'system_verified');
            await queryRunner.commitTransaction();
            return transaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Failed to convert currency: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            await queryRunner.release();
        }
    }
    async tradeCurrency(userId, tradeCurrencyDto, idempotencyKey) {
        const { sourceCurrency, targetCurrency, amount } = tradeCurrencyDto;
        if (sourceCurrency === targetCurrency) {
            throw new common_1.BadRequestException('Source and target currencies cannot be the same');
        }
        if (!this.supportedCurrencies.includes(sourceCurrency) ||
            !this.supportedCurrencies.includes(targetCurrency)) {
            throw new common_1.BadRequestException('One or both currencies are not supported');
        }
        if (idempotencyKey) {
            const existingTransaction = await this.transactionsService.findByIdempotencyKey(idempotencyKey);
            if (existingTransaction) {
                return existingTransaction;
            }
        }
        const transactionIdempotencyKey = idempotencyKey ||
            `trade-${userId}-${sourceCurrency}-${targetCurrency}-${amount}-${(0, uuid_1.v4)()}`;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const rate = await this.fxService.getRate(sourceCurrency, targetCurrency);
            const targetAmount = amount * rate;
            const sourceWallet = await this.findOrCreateWallet(userId, sourceCurrency);
            if (sourceWallet.balance < amount) {
                throw new common_1.BadRequestException(`Insufficient balance in ${sourceCurrency} wallet`);
            }
            const targetWallet = await this.findOrCreateWallet(userId, targetCurrency);
            const transaction = await this.transactionsService.createWithIdempotency({
                userId,
                type: transaction_entity_1.TransactionType.TRADE,
                sourceCurrency,
                sourceAmount: amount,
                targetCurrency,
                targetAmount,
                rate,
                status: transaction_entity_1.TransactionStatus.PENDING,
                reference: `TRADE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                idempotencyKey: transactionIdempotencyKey,
            });
            sourceWallet.balance -= amount;
            targetWallet.balance += targetAmount;
            await this.walletRepository.save(sourceWallet);
            await this.walletRepository.save(targetWallet);
            await this.transactionsService.verifyTransaction(transaction.id, 'system_verified');
            await queryRunner.commitTransaction();
            return transaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Failed to trade currency: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            await queryRunner.release();
        }
    }
    async findOrCreateWallet(userId, currency) {
        let wallet = await this.walletRepository.findOne({
            where: { userId, currency },
        });
        if (!wallet) {
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
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        fx_service_1.FxService,
        config_1.ConfigService,
        typeorm_2.DataSource,
        transactions_service_1.TransactionsService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map