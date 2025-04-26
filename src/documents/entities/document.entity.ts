import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { DocumentType } from '../../common/enums/document-type.enum';
import { Employee } from '../../employees/entities/employee.entity';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeNumber: string;

  @Column({ type: 'enum', enum: DocumentType })
  documentType: DocumentType;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  uploadedBy: string;

  @CreateDateColumn()
  uploadDate: Date;

  @Column({ default: 'Active' })
  status: string;

  @ManyToOne(() => Employee)
  employee: Employee;
}
