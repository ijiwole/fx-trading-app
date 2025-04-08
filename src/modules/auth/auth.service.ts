import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    // Send verification email
    if (!user.verificationCode) {
      throw new InternalServerErrorException(
        'Failed to generate verification code',
      );
    }

    const emailSent = await this.emailService.sendVerificationEmail(
      user.email,
      user.verificationCode,
    );

    return {
      message: 'Registration successful',
      emailSent,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
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

  async createAdmin(email: string, password: string, secretKey: string) {
    const configSecretKey = this.configService.get<string>('ADMIN_SECRET_KEY');

    if (!configSecretKey || secretKey !== configSecretKey) {
      throw new ForbiddenException('Invalid admin secret key');
    }

    const user = await this.usersService.createWithRole(
      { email, password },
      UserRole.ADMIN,
    );

    return {
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
