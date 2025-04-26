import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity()
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  employeeNumber: string;

  @Column()
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column()
  contractStartDate: Date;

  @Column({ nullable: true })
  contractEndDate: Date;

  @Column({ nullable: true })
  contractType: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  resetTokenExpiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
