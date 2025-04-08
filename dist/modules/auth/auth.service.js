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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const email_service_1 = require("./email.service");
const user_entity_1 = require("../users/entities/user.entity");
let AuthService = class AuthService {
    usersService;
    jwtService;
    emailService;
    configService;
    constructor(usersService, jwtService, emailService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.configService = configService;
    }
    async register(registerDto) {
        const user = await this.usersService.create(registerDto);
        if (!user.verificationCode) {
            throw new common_1.InternalServerErrorException('Failed to generate verification code');
        }
        const emailSent = await this.emailService.sendVerificationEmail(user.email, user.verificationCode);
        return {
            message: 'Registration successful',
            emailSent,
        };
    }
    async verifyOtp(verifyOtpDto) {
        const { email, otp } = verifyOtpDto;
        const user = await this.usersService.verifyEmail(email, otp);
        return {
            message: 'Email verification successful',
            user: {
                id: user.id,
                email: user.email,
                isVerified: user.isVerified,
            },
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.usersService.findByEmail(email);
        if (!user || !(await user.validatePassword(password))) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException('Email not verified');
        }
        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload);
        return {
            message: 'Login successful',
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
    async createAdmin(email, password, secretKey) {
        const configSecretKey = this.configService.get('ADMIN_SECRET_KEY');
        if (!configSecretKey || secretKey !== configSecretKey) {
            throw new common_1.ForbiddenException('Invalid admin secret key');
        }
        const user = await this.usersService.createWithRole({ email, password }, user_entity_1.UserRole.ADMIN);
        return {
            message: 'Admin user created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map