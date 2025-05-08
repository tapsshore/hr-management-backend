import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity()
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  code: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'headId' })
  head: Employee;

  @Column({ nullable: true })
  headId: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'parentDepartmentId' })
  parentDepartment: Department;

  @Column({ nullable: true })
  parentDepartmentId: string;

  @OneToMany(() => Department, (department) => department.parentDepartment)
  subDepartments: Department[];

  @OneToMany(() => Employee, (employee) => employee.department)
  employees: Employee[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  budget: number;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
