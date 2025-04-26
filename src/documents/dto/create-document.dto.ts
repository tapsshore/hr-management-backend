import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { DocumentType } from '../../common/enums/document-type.enum';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;
}
