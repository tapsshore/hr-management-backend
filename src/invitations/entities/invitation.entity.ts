import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: Role, array: true, default: [Role.EMPLOYEE] })
  roles: Role[];

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  department: string;

  @Column()
  token: string;

  @Column({ default: false })
  isAccepted: boolean;

  @Column({ default: false })
  isExpired: boolean;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}