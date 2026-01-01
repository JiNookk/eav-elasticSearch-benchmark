import { CustomFieldDefinition } from '../../../../domain/customField/customFieldDefinition.domain';
import { FieldType } from '../../../../domain/customField/fieldType.vo';
import { CustomFieldDefinitionEntity } from '../entity/customFieldDefinition.entity';

/**
 * CustomFieldDefinition Entity <-> Domain 변환
 */
export class CustomFieldDefinitionMapper {
  /**
   * Entity -> Domain
   */
  static toDomain(entity: CustomFieldDefinitionEntity): CustomFieldDefinition {
    return CustomFieldDefinition.create({
      id: entity.id,
      name: entity.name,
      apiName: entity.apiName,
      fieldType: entity.fieldType as FieldType,
      options: entity.options ?? undefined,
      isRequired: entity.isRequired,
    });
  }

  /**
   * Domain -> Entity (새로 생성)
   */
  static toEntity(domain: CustomFieldDefinition): CustomFieldDefinitionEntity {
    const entity = new CustomFieldDefinitionEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.apiName = domain.apiName;
    entity.fieldType = domain.fieldType;
    entity.options = domain.options.length > 0 ? [...domain.options] : null;
    entity.isRequired = domain.isRequired;
    entity.isActive = domain.isActive;
    entity.displayOrder = domain.displayOrder;
    return entity;
  }

  /**
   * Domain -> Entity (업데이트용, 기존 Entity에 값 복사)
   */
  static updateEntity(
    entity: CustomFieldDefinitionEntity,
    domain: CustomFieldDefinition,
  ): CustomFieldDefinitionEntity {
    entity.name = domain.name;
    entity.isRequired = domain.isRequired;
    entity.isActive = domain.isActive;
    entity.displayOrder = domain.displayOrder;
    // apiName, fieldType, options는 변경 불가 (생성 시 결정)
    return entity;
  }
}
