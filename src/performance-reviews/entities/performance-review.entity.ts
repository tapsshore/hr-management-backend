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

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum Rating {
  OUTSTANDING = 5,
  EXCEEDS_EXPECTATIONS = 4,
  MEETS_EXPECTATIONS = 3,
  NEEDS_IMPROVEMENT = 2,
  UNSATISFACTORY = 1,
}

@Entity()
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: Employee;

  @Column()
  reviewerId: string;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.DRAFT,
  })
  status: ReviewStatus;

  @Column()
  reviewPeriod: string; // e.g., "Q1 2024", "2024"

  @Column({
    type: 'enum',
    enum: Rating,
    nullable: true,
  })
  overallRating: Rating;

  @Column('text')
  strengths: string;

  @Column('text')
  areasForImprovement: string;

  @Column('text')
  goals: string;

  @Column('text', { nullable: true })
  comments: string;

  @Column('text', { nullable: true })
  employeeComments: string;

  @Column({ type: 'date' })
  reviewDate: Date;

  @Column({ type: 'date', nullable: true })
  nextReviewDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 