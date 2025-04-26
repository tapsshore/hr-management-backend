import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentType } from '../../common/enums/document-type.enum';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  employeeNumber?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  filePath?: string;
}
