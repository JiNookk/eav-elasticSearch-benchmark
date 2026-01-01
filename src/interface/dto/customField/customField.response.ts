import { CustomFieldDefinition } from '../../../domain/customField/customFieldDefinition.domain';
import { FieldType } from '../../../domain/customField/fieldType.vo';

/**
 * 커스텀 필드 Response DTO
 */
export class CustomFieldResponse {
  id: string;
  name: string;
  apiName: string;
  fieldType: FieldType;
  options: readonly string[];
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;

  static from(domain: CustomFieldDefinition): CustomFieldResponse {
    const response = new CustomFieldResponse();
    response.id = domain.id;
    response.name = domain.name;
    response.apiName = domain.apiName;
    response.fieldType = domain.fieldType;
    response.options = domain.options;
    response.isRequired = domain.isRequired;
    response.isActive = domain.isActive;
    response.displayOrder = domain.displayOrder;
    return response;
  }
}
