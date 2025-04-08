import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  FUNDING = 'FUNDING',
  CONVERSION = 'CONVERSION',
  TRADE = 'TRADE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ nullable: true })
  sourceCurrency: string;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  sourceAmount: number;

  @Column({ nullable: true })
  targetCurrency: string;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  targetAmount: number;

  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  rate: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true, unique: true })
  @Index()
  idempotencyKey: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationReference: string | null;

  @Column({ default: 0 })
  verificationAttempts: number;
}
