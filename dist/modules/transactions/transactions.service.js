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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const uuid_1 = require("uuid");
let TransactionsService = class TransactionsService {
    transactionRepository;
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }
    async findByUser(userId, limit = 10, offset = 0) {
        const [transactions, total] = await this.transactionRepository.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { transactions, total };
    }
    async findByType(userId, type, limit = 10, offset = 0) {
        const [transactions, total] = await this.transactionRepository.findAndCount({
            where: { userId, type },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { transactions, total };
    }
    async findById(id, userId) {
        return this.transactionRepository.findOne({
            where: { id, userId },
        });
    }
    async findAll(limit = 100, offset = 0) {
        const [transactions, total] = await this.transactionRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { transactions, total };
    }
    async findByIdempotencyKey(idempotencyKey) {
        return this.transactionRepository.findOne({
            where: { idempotencyKey },
        });
    }
    async createWithIdempotency(params) {
        const { idempotencyKey = (0, uuid_1.v4)(), ...transactionData } = params;
        const existingTransaction = await this.findByIdempotencyKey(idempotencyKey);
        if (existingTransaction) {
            return existingTransaction;
        }
        const transaction = this.transactionRepository.create({
            ...transactionData,
            idempotencyKey,
        });
        return this.transactionRepository.save(transaction);
    }
    async verifyTransaction(id, verificationReference) {
        const transaction = await this.transactionRepository.findOne({
            where: { id },
        });
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        transaction.verified = true;
        transaction.verificationReference = verificationReference || null;
        transaction.verificationAttempts += 1;
        if (transaction.status === transaction_entity_1.TransactionStatus.PENDING) {
            transaction.status = transaction_entity_1.TransactionStatus.COMPLETED;
        }
        return this.transactionRepository.save(transaction);
    }
    async countByType(type) {
        return this.transactionRepository.count({
            where: { type },
        });
    }
    async getTransactionsInPeriod(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return this.transactionRepository.count({
            where: {
                createdAt: (0, typeorm_2.MoreThanOrEqual)(date),
            },
        });
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map