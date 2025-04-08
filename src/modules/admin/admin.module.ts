import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletModule } from '../wallet/wallet.module';
import { FxModule } from '../fx/fx.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TransactionsModule,
    WalletModule,
    FxModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
