import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';
export declare class AuthService {
    private usersService;
    private jwtService;
    private emailService;
    private configService;
    constructor(usersService: UsersService, jwtService: JwtService, emailService: EmailService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        emailSent: boolean;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            isVerified: boolean;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: UserRole;
        };
    }>;
    createAdmin(email: string, password: string, secretKey: string): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            role: UserRole;
        };
    }>;
}
