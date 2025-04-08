import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { users, total };
  }

  async countVerifiedUsers(): Promise<number> {
    return this.usersRepository.count({
      where: { isVerified: true },
    });
  }

  async countAdminUsers(): Promise<number> {
    return this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });
  }

  async getRegistrationsInPeriod(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.usersRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date),
      },
    });
  }

  async create(registerDto: RegisterDto): Promise<User> {
    const { email, password } = registerDto;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
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

  async createWithRole(
    registerDto: RegisterDto,
    role: UserRole,
  ): Promise<User> {
    const { email, password } = registerDto;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
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
      role, // Set the specified role
      isVerified: true, // Admins are auto-verified
    });

    return this.usersRepository.save(user);
  }

  async verifyEmail(email: string, otp: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new ConflictException('Email already verified');
    }

    if (user.verificationCode !== otp) {
      throw new ConflictException('Invalid OTP');
    }

    if (
      !user.verificationCodeExpiry ||
      new Date() > user.verificationCodeExpiry
    ) {
      throw new ConflictException('OTP expired');
    }

    // Mark email as verified and clear OTP
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;

    return this.usersRepository.save(user);
  }
}
