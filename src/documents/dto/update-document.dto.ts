import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { DocumentType } from '../../common/enums/document-type.enum';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}