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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const admin_guard_1 = require("../../common/guards/admin.guard");
const auth_service_1 = require("../auth/auth.service");
const users_service_1 = require("../users/users.service");
const transactions_service_1 = require("../transactions/transactions.service");
const fx_service_1 = require("../fx/fx.service");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const swagger_1 = require("@nestjs/swagger");
const create_admin_dto_1 = require("./dto/create-admin.dto");
const pagination_dto_1 = require("./dto/pagination.dto");
let AdminController = class AdminController {
    authService;
    usersService;
    transactionsService;
    fxService;
    constructor(authService, usersService, transactionsService, fxService) {
        this.authService = authService;
        this.usersService = usersService;
        this.transactionsService = transactionsService;
        this.fxService = fxService;
    }
    createAdmin(createAdminDto) {
        return this.authService.createAdmin(createAdminDto.email, createAdminDto.password, createAdminDto.secretKey);
    }
    async getAllUsers(query) {
        try {
            const limit = query.limit || 20;
            const offset = query.offset || 0;
            if (limit > 100) {
                throw new common_1.BadRequestException('Limit cannot exceed 100 users per request');
            }
            const users = await this.usersService.findAll(limit, offset);
            const safeUsers = users.users.map((user) => ({
                id: user.id,
                email: user.email,
                isVerified: user.isVerified,
                role: user.role,
                createdAt: user.createdAt,
            }));
            return {
                success: true,
                users: safeUsers,
                total: users.total,
                limit,
                offset,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to retrieve users');
        }
    }
    async getAllTransactions(query) {
        try {
            const limit = query.limit || 20;
            const offset = query.offset || 0;
            if (limit > 100) {
                throw new common_1.BadRequestException('Limit cannot exceed 100 transactions per request');
            }
            const result = await this.transactionsService.findAll(limit, offset);
            return {
                success: true,
                transactions: result.transactions,
                total: result.total,
                limit,
                offset,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to retrieve transactions');
        }
    }
    async getDashboardData() {
        try {
            const userStats = await this.getUserStats();
            const transactionStats = await this.getTransactionStats();
            const fxRates = await this.fxService.getAllRates();
            return {
                success: true,
                stats: {
                    users: userStats,
                    transactions: transactionStats,
                    fxRates: {
                        lastUpdated: new Date(),
                        rateCount: Object.keys(fxRates).length,
                    },
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new common_1.BadRequestException('Failed to retrieve dashboard data: ' + errorMessage);
        }
    }
    async refreshFxRates() {
        try {
            await this.fxService.invalidateRatesCache();
            const newRates = await this.fxService.getAllRates();
            return {
                success: true,
                message: 'FX rates cache refreshed successfully',
                rateCount: Object.keys(newRates).length,
                timestamp: new Date(),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new common_1.BadRequestException('Failed to refresh FX rates: ' + errorMessage);
        }
    }
    async getUserStats() {
        const allUsers = await this.usersService.findAll(1, 0);
        const verifiedUsersCount = await this.usersService.countVerifiedUsers();
        const adminUsersCount = await this.usersService.countAdminUsers();
        return {
            total: allUsers.total,
            verified: verifiedUsersCount,
            admins: adminUsersCount,
            registrationRate: {
                daily: await this.usersService.getRegistrationsInPeriod(1),
                weekly: await this.usersService.getRegistrationsInPeriod(7),
                monthly: await this.usersService.getRegistrationsInPeriod(30),
            },
        };
    }
    async getTransactionStats() {
        const allTransactions = await this.transactionsService.findAll(1, 0);
        const transactionVolume = await this.calculateTransactionVolume();
        const fundingCount = await this.transactionsService.countByType(transaction_entity_1.TransactionType.FUNDING);
        const conversionCount = await this.transactionsService.countByType(transaction_entity_1.TransactionType.CONVERSION);
        const tradeCount = await this.transactionsService.countByType(transaction_entity_1.TransactionType.TRADE);
        return {
            total: allTransactions.total,
            volume: transactionVolume,
            byType: {
                funding: fundingCount,
                conversion: conversionCount,
                trade: tradeCount,
            },
            recentActivity: {
                daily: await this.transactionsService.getTransactionsInPeriod(1),
                weekly: await this.transactionsService.getTransactionsInPeriod(7),
            },
        };
    }
    async calculateTransactionVolume() {
        const recentTransactions = await this.transactionsService.findAll(100, 0);
        const volumeByCurrency = {};
        for (const transaction of recentTransactions.transactions) {
            if (transaction.sourceCurrency) {
                if (!volumeByCurrency[transaction.sourceCurrency]) {
                    volumeByCurrency[transaction.sourceCurrency] = 0;
                }
                volumeByCurrency[transaction.sourceCurrency] += Number(transaction.sourceAmount);
            }
            if (transaction.targetCurrency) {
                if (!volumeByCurrency[transaction.targetCurrency]) {
                    volumeByCurrency[transaction.targetCurrency] = 0;
                }
                volumeByCurrency[transaction.targetCurrency] += Number(transaction.targetAmount);
            }
        }
        return volumeByCurrency;
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new admin user' }),
    (0, swagger_1.ApiBody)({ type: create_admin_dto_1.CreateAdminDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Admin user successfully created',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - invalid data or secret key',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Conflict - Email already in use',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users with pagination' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Number of users to return (max 100)',
        type: Number,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        description: 'Number of users to skip',
        type: Number,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of users retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid pagination parameters',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - User is not an admin',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all transactions with pagination' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Number of transactions to return (max 100)',
        type: Number,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        description: 'Number of transactions to skip',
        type: Number,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of transactions retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid pagination parameters',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - User is not an admin',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics and metrics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard data retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - User is not an admin',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardData", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Post)('fx/refresh-rates'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh FX rates cache' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'FX rates cache refreshed successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - User is not an admin',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "refreshFxRates", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService,
        transactions_service_1.TransactionsService,
        fx_service_1.FxService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map