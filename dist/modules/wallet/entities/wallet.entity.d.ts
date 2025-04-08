import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare class Wallet extends BaseEntity {
    user: User;
    userId: string;
    currency: string;
    balance: number;
    isActive: boolean;
}
