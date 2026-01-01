import { FieldType } from '../../../domain/customField/fieldType.vo';

/**
 * 커스텀 필드 정의 생성 DTO
 */
export interface CreateCustomFieldDefinitionDto {
  name: string;
  apiName: string;
  fieldType: FieldType;
  options?: string[];
  isRequired?: boolean;
}
