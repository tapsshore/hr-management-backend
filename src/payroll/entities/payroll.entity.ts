import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CASH = 'CASH',
}

@Entity()
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: string;

  @Column()
  month: number;

  @Column()
  year: number;

  @Column('decimal', { precision: 10, scale: 2 })
  basicSalary: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  allowances: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deductions: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  overtime: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  bonuses: number;

  @Column('decimal', { precision: 10, scale: 2 })
  netSalary: number;

  @Column({
    type: 'enum',
    enum: PayrollStatus,
    default: PayrollStatus.DRAFT,
  })
  status: PayrollStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.BANK_TRANSFER,
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  bankAccount: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  paymentDate: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 