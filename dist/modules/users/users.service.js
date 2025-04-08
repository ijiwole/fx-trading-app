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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findById(id) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findAll(limit = 10, offset = 0) {
        const [users, total] = await this.usersRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { users, total };
    }
    async countVerifiedUsers() {
        return this.usersRepository.count({
            where: { isVerified: true },
        });
    }
    async countAdminUsers() {
        return this.usersRepository.count({
            where: { role: user_entity_1.UserRole.ADMIN },
        });
    }
    async getRegistrationsInPeriod(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return this.usersRepository.count({
            where: {
                createdAt: (0, typeorm_2.MoreThanOrEqual)(date),
            },
        });
    }
    async create(registerDto) {
        const { email, password } = registerDto;
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('Email already in use');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = this.usersRepository.create({
            email,
            password: hashedPassword,
            verificationCode: otp,
            verificationCodeExpiry: otpExpiry,
        });
        return this.usersRepository.save(user);
    }
    async createWithRole(registerDto, role) {
        const { email, password } = registerDto;
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('Email already in use');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = this.usersRepository.create({
            email,
            password: hashedPassword,
            verificationCode: otp,
            verificationCodeExpiry: otpExpiry,
            role,
            isVerified: true,
        });
        return this.usersRepository.save(user);
    }
    async verifyEmail(email, otp) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.isVerified) {
            throw new common_1.ConflictException('Email already verified');
        }
        if (user.verificationCode !== otp) {
            throw new common_1.ConflictException('Invalid OTP');
        }
        if (!user.verificationCodeExpiry ||
            new Date() > user.verificationCodeExpiry) {
            throw new common_1.ConflictException('OTP expired');
        }
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        return this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map