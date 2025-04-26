import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { DocumentType } from '../../common/enums/document-type.enum';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Document name is required' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: number;
}