import { Contact } from './contact.domain';
import { CustomFieldDefinition } from '../customField/customFieldDefinition.domain';
import { FieldType } from '../customField/fieldType.vo';

describe('Contact', () => {
  const now = new Date('2024-01-01T00:00:00Z');

  // 테스트용 필드 정의 헬퍼
  const createTextField = () => {
    const field = CustomFieldDefinition.create({
      id: 'def-1',
      name: '메모',
      apiName: 'memo__c',
      fieldType: FieldType.TEXT,
    });
    field.activate();
    return field;
  };

  const createNumberField = () => {
    const field = CustomFieldDefinition.create({
      id: 'def-2',
      name: '나이',
      apiName: 'age__c',
      fieldType: FieldType.NUMBER,
    });
    field.activate();
    return field;
  };

  const createInactiveField = () => {
    const field = CustomFieldDefinition.create({
      id: 'def-3',
      name: '비활성 필드',
      apiName: 'inactive__c',
      fieldType: FieldType.TEXT,
    });
    field.deactivate();
    return field;
  };

  describe('생성', () => {
    it('Contact를 생성할 수 있다', () => {
      // Given
      const args = {
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      };

      // When
      const contact = Contact.create(args);

      // Then
      expect(contact.id).toBe('contact-1');
      expect(contact.email).toBe('user@example.com');
      expect(contact.name).toBe('홍길동');
      expect(contact.createdAt).toEqual(now);
      expect(contact.updatedAt).toEqual(now);
    });

    it('이름 앞뒤 공백은 자동으로 제거된다', () => {
      // Given
      const args = {
        id: 'contact-1',
        email: 'user@example.com',
        name: '  홍길동  ',
        createdAt: now,
        updatedAt: now,
      };

      // When
      const contact = Contact.create(args);

      // Then
      expect(contact.name).toBe('홍길동');
    });

    it('유효하지 않은 이메일 형식이면 에러가 발생한다', () => {
      // Given
      const args = {
        id: 'contact-1',
        email: 'invalid-email',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      };

      // When & Then
      expect(() => Contact.create(args)).toThrow(
        '유효한 이메일 형식이 아닙니다',
      );
    });

    it('이름이 비어있으면 에러가 발생한다', () => {
      // Given
      const args = {
        id: 'contact-1',
        email: 'user@example.com',
        name: '',
        createdAt: now,
        updatedAt: now,
      };

      // When & Then
      expect(() => Contact.create(args)).toThrow('이름은 필수입니다');
    });

    it('이름이 공백만 있으면 에러가 발생한다', () => {
      // Given
      const args = {
        id: 'contact-1',
        email: 'user@example.com',
        name: '   ',
        createdAt: now,
        updatedAt: now,
      };

      // When & Then
      expect(() => Contact.create(args)).toThrow('이름은 필수입니다');
    });
  });

  describe('프로필 업데이트', () => {
    it('이름을 변경할 수 있다', () => {
      // Given
      const contact = Contact.create({
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      });

      // When
      contact.updateProfile('김철수');

      // Then
      expect(contact.name).toBe('김철수');
    });

    it('빈 이름으로 변경하면 에러가 발생한다', () => {
      // Given
      const contact = Contact.create({
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      });

      // When & Then
      expect(() => contact.updateProfile('')).toThrow('이름은 필수입니다');
    });
  });

  describe('커스텀 필드 관리', () => {
    it('커스텀 필드 값을 설정할 수 있다', () => {
      // Given
      const contact = Contact.create({
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      });
      const fieldDef = createTextField();

      // When
      contact.setCustomFieldValue(fieldDef, '메모 내용', 'val-1');

      // Then
      const value = contact.getCustomFieldValue(fieldDef.id);
      expect(value).toBeDefined();
      expect(value?.getValue()).toBe('메모 내용');
    });

    it('여러 커스텀 필드 값을 설정할 수 있다', () => {
      // Given
      const contact = Contact.create({
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      });
      const textField = createTextField();
      const numberField = createNumberField();

      // When
      contact.setCustomFieldValue(textField, '메모 내용', 'val-1');
      contact.setCustomFieldValue(numberField, 25, 'val-2');

      // Then
      const allValues = contact.getAllCustomFieldValues();
      expect(allValues).toHaveLength(2);
    });

    it('동일한 필드의 값을 업데이트할 수 있다', () => {
      // Given
      const contact = Contact.create({
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      });
      const fieldDef = createTextField();
      contact.setCustomFieldValue(fieldDef, '원래 값', 'val-1');

      // When
      contact.setCustomFieldValue(fieldDef, '새로운 값', 'val-1');

      // Then
      const value = contact.getCustomFieldValue(fieldDef.id);
      expect(value?.getValue()).toBe('새로운 값');
    });

    it('비활성화된 필드에는 값을 설정할 수 없다', () => {
      // Given
      const contact = Contact.create({
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      });
      const inactiveField = createInactiveField();

      // When & Then
      expect(() =>
        contact.setCustomFieldValue(inactiveField, '값', 'val-1'),
      ).toThrow('비활성화된 필드에는 값을 설정할 수 없습니다');
    });

    it('설정되지 않은 필드 값을 조회하면 undefined를 반환한다', () => {
      // Given
      const contact = Contact.create({
        id: 'contact-1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: now,
        updatedAt: now,
      });

      // When
      const value = contact.getCustomFieldValue('non-existent');

      // Then
      expect(value).toBeUndefined();
    });
  });
});
