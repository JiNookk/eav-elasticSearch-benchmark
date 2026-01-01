import { CustomFieldDefinition } from '../../../../domain/customField/customFieldDefinition.domain';
import { FieldType } from '../../../../domain/customField/fieldType.vo';
import { FieldDefinitionEntity } from '../entity/fieldDefinition.entity';

/**
 * 엔티티 dataType (소문자) -> 도메인 FieldType (대문자) 변환
 */
function toFieldType(dataType: string): FieldType {
  const mapping: Record<string, FieldType> = {
    text: FieldType.TEXT,
    number: FieldType.NUMBER,
    date: FieldType.DATE,
    select: FieldType.SELECT,
    multi_select: FieldType.SELECT, // multi_select는 SELECT로 취급
  };
  return mapping[dataType] ?? FieldType.TEXT;
}

/**
 * 도메인 FieldType (대문자) -> 엔티티 dataType (소문자) 변환
 */
function toDataType(
  fieldType: FieldType,
): 'text' | 'number' | 'date' | 'select' | 'multi_select' {
  const mapping: Record<
    FieldType,
    'text' | 'number' | 'date' | 'select' | 'multi_select'
  > = {
    TEXT: 'text',
    NUMBER: 'number',
    DATE: 'date',
    SELECT: 'select',
  };
  return mapping[fieldType] ?? 'text';
}

/**
 * CustomFieldDefinition Entity <-> Domain 변환
 * FieldDefinitionEntity (Salesforce 스타일) 사용
 */
export class CustomFieldDefinitionMapper {
  /**
   * Entity -> Domain
   */
  static toDomain(entity: FieldDefinitionEntity): CustomFieldDefinition {
    return CustomFieldDefinition.create({
      id: entity.id,
      name: entity.label, // Entity는 label, Domain은 name
      apiName: entity.apiName,
      fieldType: toFieldType(entity.dataType),
      options: entity.options ?? undefined,
      isRequired: entity.isRequired,
    });
  }

  /**
   * Domain -> Entity (새로 생성)
   */
  static toEntity(domain: CustomFieldDefinition): FieldDefinitionEntity {
    const entity = new FieldDefinitionEntity();
    entity.id = domain.id;
    entity.label = domain.name; // Domain은 name, Entity는 label
    entity.apiName = domain.apiName;
    entity.dataType = toDataType(domain.fieldType);
    entity.options = domain.options.length > 0 ? [...domain.options] : null;
    entity.isRequired = domain.isRequired;
    return entity;
  }

  /**
   * Domain -> Entity (업데이트용, 기존 Entity에 값 복사)
   */
  static updateEntity(
    entity: FieldDefinitionEntity,
    domain: CustomFieldDefinition,
  ): FieldDefinitionEntity {
    entity.label = domain.name;
    entity.isRequired = domain.isRequired;
    // apiName, dataType, options는 변경 불가 (생성 시 결정)
    return entity;
  }
}
