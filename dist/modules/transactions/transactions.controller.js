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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const transactions_service_1 = require("./transactions.service");
const transaction_entity_1 = require("./entities/transaction.entity");
const swagger_1 = require("@nestjs/swagger");
const transaction_query_dto_1 = require("./dto/transaction-query.dto");
let TransactionsController = class TransactionsController {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async getTransactions(req, query) {
        const userId = req.user.userId;
        const { limit = 10, offset = 0, type } = query;
        let result;
        if (type) {
            if (!Object.values(transaction_entity_1.TransactionType).includes(type)) {
                throw new common_1.NotFoundException(`Invalid transaction type: ${type}`);
            }
            result = await this.transactionsService.findByType(userId, type, limit, offset);
        }
        else {
            result = await this.transactionsService.findByUser(userId, limit, offset);
        }
        const transactions = result.transactions.map((tx) => ({
            id: tx.id,
            type: tx.type,
            sourceCurrency: tx.sourceCurrency || '',
            sourceAmount: tx.sourceAmount,
            targetCurrency: tx.targetCurrency || '',
            targetAmount: tx.targetAmount,
            rate: tx.rate || 0,
            status: tx.status,
            reference: tx.reference || '',
            createdAt: tx.createdAt,
        }));
        return {
            transactions,
            total: result.total,
            limit,
            offset,
        };
    }
    async getTransaction(req, id) {
        const transaction = await this.transactionsService.findById(id, req.user.userId);
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        return {
            transaction: {
                id: transaction.id,
                type: transaction.type,
                sourceCurrency: transaction.sourceCurrency,
                sourceAmount: transaction.sourceAmount,
                targetCurrency: transaction.targetCurrency,
                targetAmount: transaction.targetAmount,
                rate: transaction.rate,
                status: transaction.status,
                reference: transaction.reference,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
                metadata: transaction.metadata,
            },
        };
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all transactions for the authenticated user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns a paginated list of transactions',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Not Found - Invalid transaction type',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transaction_query_dto_1.TransactionQueryDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific transaction by ID' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Transaction ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns the transaction details',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Not Found - Transaction not found',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransaction", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)('transactions'),
    (0, common_1.Controller)('transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map