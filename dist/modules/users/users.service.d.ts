import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User>;
    findAll(limit?: number, offset?: number): Promise<{
        users: User[];
        total: number;
    }>;
    countVerifiedUsers(): Promise<number>;
    countAdminUsers(): Promise<number>;
    getRegistrationsInPeriod(days: number): Promise<number>;
    create(registerDto: RegisterDto): Promise<User>;
    createWithRole(registerDto: RegisterDto, role: UserRole): Promise<User>;
    verifyEmail(email: string, otp: string): Promise<User>;
}
