import { Contact } from '../../../../domain/contact/contact.domain';
import { CustomFieldDefinition } from '../../../../domain/customField/customFieldDefinition.domain';
import { CustomFieldValue } from '../../../../domain/customField/customFieldValue.domain';
import { ContactEntity } from '../entity/contact.entity';
import { FieldValueEntity } from '../entity/fieldValue.entity';
import { FieldType } from '../../../../domain/customField/fieldType.vo';

/**
 * Contact Entity <-> Domain 매퍼
 * Salesforce 스타일 엔티티 (firstName, lastName, fieldValues) 사용
 */
export class ContactMapper {
  /**
   * Entity -> Domain 변환
   */
  static toDomain(
    entity: ContactEntity,
    fieldDefinitions: Map<string, CustomFieldDefinition>,
  ): Contact {
    // FieldValue 엔티티들을 도메인으로 변환
    const customFieldValues: CustomFieldValue[] = [];

    if (entity.fieldValues) {
      for (const valueEntity of entity.fieldValues) {
        const definition = fieldDefinitions.get(valueEntity.fieldId);
        if (!definition) {
          // 정의가 없으면 스킵 (삭제된 필드일 수 있음)
          continue;
        }

        const value = this.extractValueFromEntity(valueEntity, definition);
        if (value !== null && value !== undefined) {
          const fieldValue = CustomFieldValue.create({
            id: valueEntity.id,
            fieldDefinition: definition,
            value,
          });
          customFieldValues.push(fieldValue);
        }
      }
    }

    // firstName + lastName -> name 조합
    const fullName = `${entity.firstName} ${entity.lastName}`.trim();

    return Contact.reconstitute({
      id: entity.id,
      email: entity.email ?? '', // Entity에서 email이 nullable이므로 기본값 처리
      name: fullName,
      customFieldValues,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain -> Entity 변환
   */
  static toEntity(domain: Contact): ContactEntity {
    const entity = new ContactEntity();
    entity.id = domain.id;
    entity.email = domain.email;

    // name -> firstName, lastName 분리 (첫 공백 기준)
    const nameParts = domain.name.split(' ');
    entity.firstName = nameParts[0] || '';
    entity.lastName = nameParts.slice(1).join(' ') || '';

    entity.phone = null;
    entity.accountId = null;
    entity.status = 'active';
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    // FieldValues 변환
    entity.fieldValues = domain.customFieldValues.map((fieldValue) =>
      this.fieldValueToEntity(fieldValue, domain.id),
    );

    return entity;
  }

  /**
   * CustomFieldValue Domain -> FieldValueEntity 변환
   * 모든 타입의 값을 TEXT 컬럼에 문자열로 저장
   */
  private static fieldValueToEntity(
    fieldValue: CustomFieldValue,
    contactId: string,
  ): FieldValueEntity {
    const entity = new FieldValueEntity();
    entity.id = fieldValue.id;
    entity.recordId = contactId;
    entity.fieldId = fieldValue.fieldDefinition.id;

    // 모든 값을 문자열로 직렬화
    const rawValue = fieldValue.getValue();
    if (rawValue === null || rawValue === undefined) {
      entity.value = null;
    } else if (rawValue instanceof Date) {
      entity.value = rawValue.toISOString().split('T')[0]; // YYYY-MM-DD
    } else {
      entity.value = String(rawValue);
    }

    return entity;
  }

  /**
   * Entity에서 타입에 맞는 값 추출
   * TEXT 컬럼에서 도메인 타입으로 역직렬화
   */
  private static extractValueFromEntity(
    entity: FieldValueEntity,
    definition: CustomFieldDefinition,
  ): string | number | Date | null {
    if (entity.value === null || entity.value === undefined) {
      return null;
    }

    switch (definition.fieldType) {
      case FieldType.TEXT:
      case FieldType.SELECT:
        return entity.value;
      case FieldType.NUMBER: {
        const num = parseFloat(entity.value);
        return isNaN(num) ? null : num;
      }
      case FieldType.DATE:
        return new Date(entity.value);
      default:
        return entity.value;
    }
  }
}
