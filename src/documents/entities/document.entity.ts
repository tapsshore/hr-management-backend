import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { DocumentType } from '../../common/enums/document-type.enum';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type: DocumentType;

  @Column()
  fileKey: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @ManyToOne(() => Employee, employee => employee.documents)
  employee: Employee;

  @Column()
  employeeId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}