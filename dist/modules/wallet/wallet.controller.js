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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const wallet_service_1 = require("./wallet.service");
const fund_wallet_dto_1 = require("./dto/fund-wallet.dto");
const convert_currency_dto_1 = require("./dto/convert-currency.dto");
const trade_currency_dto_1 = require("./dto/trade-currency.dto");
const swagger_1 = require("@nestjs/swagger");
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getWallets(req) {
        const wallets = await this.walletService.findUserWallets(req.user.userId);
        return {
            wallets: wallets.map((wallet) => ({
                id: wallet.id,
                currency: wallet.currency,
                balance: wallet.balance,
            })),
        };
    }
    async fundWallet(req, fundWalletDto, idempotencyKey) {
        const transaction = await this.walletService.fundWallet(req.user.userId, fundWalletDto, idempotencyKey);
        return {
            message: 'Wallet funded successfully',
            transaction: {
                id: transaction.id,
                amount: transaction.sourceAmount,
                currency: transaction.sourceCurrency,
                status: transaction.status,
                createdAt: transaction.createdAt,
                idempotencyKey: transaction.idempotencyKey,
            },
        };
    }
    async convertCurrency(req, convertCurrencyDto, idempotencyKey) {
        const transaction = await this.walletService.convertCurrency(req.user.userId, convertCurrencyDto, idempotencyKey);
        return {
            message: 'Currency converted successfully',
            transaction: {
                id: transaction.id,
                sourceCurrency: transaction.sourceCurrency,
                sourceAmount: transaction.sourceAmount,
                targetCurrency: transaction.targetCurrency,
                targetAmount: transaction.targetAmount,
                rate: transaction.rate,
                status: transaction.status,
                createdAt: transaction.createdAt,
                idempotencyKey: transaction.idempotencyKey,
            },
        };
    }
    async tradeCurrency(req, tradeCurrencyDto, idempotencyKey) {
        const transaction = await this.walletService.tradeCurrency(req.user.userId, tradeCurrencyDto, idempotencyKey);
        return {
            message: 'Currency traded successfully',
            transaction: {
                id: transaction.id,
                sourceCurrency: transaction.sourceCurrency,
                sourceAmount: transaction.sourceAmount,
                targetCurrency: transaction.targetCurrency,
                targetAmount: transaction.targetAmount,
                rate: transaction.rate,
                status: transaction.status,
                createdAt: transaction.createdAt,
                idempotencyKey: transaction.idempotencyKey,
            },
        };
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all wallets for the authenticated user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns a list of user wallets',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWallets", null);
__decorate([
    (0, common_1.Post)('fund'),
    (0, swagger_1.ApiOperation)({ summary: 'Fund a wallet with specified currency and amount' }),
    (0, swagger_1.ApiBody)({ type: fund_wallet_dto_1.FundWalletDto }),
    (0, swagger_1.ApiHeader)({
        name: 'idempotency-key',
        description: 'Unique key to prevent duplicate funding operations',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Wallet funded successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid data',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fund_wallet_dto_1.FundWalletDto, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "fundWallet", null);
__decorate([
    (0, common_1.Post)('convert'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert funds from one currency to another' }),
    (0, swagger_1.ApiBody)({ type: convert_currency_dto_1.ConvertCurrencyDto }),
    (0, swagger_1.ApiHeader)({
        name: 'idempotency-key',
        description: 'Unique key to prevent duplicate conversion operations',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Currency converted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid data or insufficient funds',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, convert_currency_dto_1.ConvertCurrencyDto, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "convertCurrency", null);
__decorate([
    (0, common_1.Post)('trade'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a trade between two currencies' }),
    (0, swagger_1.ApiBody)({ type: trade_currency_dto_1.TradeCurrencyDto }),
    (0, swagger_1.ApiHeader)({
        name: 'idempotency-key',
        description: 'Unique key to prevent duplicate trade operations',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Currency traded successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid data or insufficient funds',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, trade_currency_dto_1.TradeCurrencyDto, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "tradeCurrency", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('wallet'),
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map