import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}
export declare class User extends BaseEntity {
    email: string;
    password: string;
    isVerified: boolean;
    verificationCode: string | null;
    verificationCodeExpiry: Date | null;
    role: UserRole;
    validatePassword(password: string): Promise<boolean>;
}
