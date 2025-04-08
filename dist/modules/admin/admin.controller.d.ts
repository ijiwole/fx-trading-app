import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FxService } from '../fx/fx.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PaginationDto } from './dto/pagination.dto';
export declare class AdminController {
    private readonly authService;
    private readonly usersService;
    private readonly transactionsService;
    private readonly fxService;
    constructor(authService: AuthService, usersService: UsersService, transactionsService: TransactionsService, fxService: FxService);
    createAdmin(createAdminDto: CreateAdminDto): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
    getAllUsers(query: PaginationDto): Promise<{
        success: boolean;
        users: {
            id: string;
            email: string;
            isVerified: boolean;
            role: import("../users/entities/user.entity").UserRole;
            createdAt: Date;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getAllTransactions(query: PaginationDto): Promise<{
        success: boolean;
        transactions: import("../transactions/entities/transaction.entity").Transaction[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getDashboardData(): Promise<{
        success: boolean;
        stats: {
            users: {
                total: number;
                verified: number;
                admins: number;
                registrationRate: {
                    daily: number;
                    weekly: number;
                    monthly: number;
                };
            };
            transactions: {
                total: number;
                volume: {};
                byType: {
                    funding: number;
                    conversion: number;
                    trade: number;
                };
                recentActivity: {
                    daily: number;
                    weekly: number;
                };
            };
            fxRates: {
                lastUpdated: Date;
                rateCount: number;
            };
        };
    }>;
    refreshFxRates(): Promise<{
        success: boolean;
        message: string;
        rateCount: number;
        timestamp: Date;
    }>;
    private getUserStats;
    private getTransactionStats;
    private calculateTransactionVolume;
}
