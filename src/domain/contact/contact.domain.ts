import { CustomFieldDefinition } from '../customField/customFieldDefinition.domain';
import { CustomFieldValue } from '../customField/customFieldValue.domain';

export interface CreateContactArgs {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReconstituteContactArgs {
  id: string;
  email: string;
  name: string;
  customFieldValues: CustomFieldValue[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contact(고객) 도메인
 * - 기본 정보(email, name) 관리
 * - 커스텀 필드 값 관리
 */
export class Contact {
  private readonly _customFieldValues: Map<string, CustomFieldValue>;
  private readonly _customFieldValuesByApiName: Map<string, CustomFieldValue>;

  private constructor(
    private readonly _id: string,
    private readonly _email: string,
    private _name: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this._customFieldValues = new Map();
    this._customFieldValuesByApiName = new Map();
  }

  /**
   * Contact 생성
   * @throws 이메일 형식이 잘못된 경우
   * @throws 이름이 비어있는 경우
   */
  static create(args: CreateContactArgs): Contact {
    // 이메일 형식 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
      throw new Error('유효한 이메일 형식이 아닙니다');
    }

    // 이름 검증
    const trimmedName = args.name?.trim() ?? '';
    if (trimmedName.length === 0) {
      throw new Error('이름은 필수입니다');
    }

    return new Contact(
      args.id,
      args.email,
      trimmedName,
      args.createdAt,
      args.updatedAt,
    );
  }

  /**
   * 영속성에서 복원
   */
  static reconstitute(args: ReconstituteContactArgs): Contact {
    const contact = new Contact(
      args.id,
      args.email,
      args.name,
      args.createdAt,
      args.updatedAt,
    );

    // 커스텀 필드 값 복원
    for (const fieldValue of args.customFieldValues) {
      contact._customFieldValues.set(fieldValue.fieldDefinition.id, fieldValue);
      contact._customFieldValuesByApiName.set(
        fieldValue.fieldDefinition.apiName,
        fieldValue,
      );
    }

    return contact;
  }

  /**
   * 이름 업데이트
   * @throws 이름이 비어있는 경우
   */
  updateName(name: string, now: Date): void {
    const trimmedName = name?.trim() ?? '';
    if (trimmedName.length === 0) {
      throw new Error('이름은 필수입니다');
    }
    this._name = trimmedName;
    this._updatedAt = now;
  }

  /**
   * 프로필 업데이트 (deprecated, use updateName)
   * @throws 이름이 비어있는 경우
   */
  updateProfile(name: string): void {
    const trimmedName = name?.trim() ?? '';
    if (trimmedName.length === 0) {
      throw new Error('이름은 필수입니다');
    }
    this._name = trimmedName;
  }

  /**
   * 커스텀 필드 값 설정
   * - 기존 값이 있으면 업데이트
   * - 없으면 새로 생성
   * @throws 필드가 비활성화된 경우
   * @throws 값이 유효하지 않은 경우
   */
  setCustomFieldValue(
    fieldDefinition: CustomFieldDefinition,
    value: string | number | Date,
    valueId: string,
  ): void {
    if (!fieldDefinition.isActive) {
      throw new Error('비활성화된 필드에는 값을 설정할 수 없습니다');
    }

    const existingValue = this._customFieldValues.get(fieldDefinition.id);

    if (existingValue) {
      existingValue.updateValue(value);
    } else {
      const newValue = CustomFieldValue.create({
        id: valueId,
        fieldDefinition,
        value,
      });
      this._customFieldValues.set(fieldDefinition.id, newValue);
      this._customFieldValuesByApiName.set(fieldDefinition.apiName, newValue);
    }
  }

  /**
   * 커스텀 필드 값 제거
   * @param apiName 필드 API 이름
   */
  removeCustomFieldValue(apiName: string): void {
    const fieldValue = this._customFieldValuesByApiName.get(apiName);
    if (fieldValue) {
      this._customFieldValues.delete(fieldValue.fieldDefinition.id);
      this._customFieldValuesByApiName.delete(apiName);
    }
  }

  /**
   * 커스텀 필드 값 조회
   * @param fieldDefinitionId 필드 정의 ID
   * @returns 값이 없으면 undefined
   */
  getCustomFieldValue(fieldDefinitionId: string): CustomFieldValue | undefined {
    return this._customFieldValues.get(fieldDefinitionId);
  }

  /**
   * 모든 커스텀 필드 값 조회
   */
  getAllCustomFieldValues(): CustomFieldValue[] {
    return Array.from(this._customFieldValues.values());
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get customFieldValues(): CustomFieldValue[] {
    return Array.from(this._customFieldValues.values());
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
