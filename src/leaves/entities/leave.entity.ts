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

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  OTHER = 'OTHER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: string;

  @Column({
    type: 'enum',
    enum: LeaveType,
  })
  type: LeaveType;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  reason: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  approvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 