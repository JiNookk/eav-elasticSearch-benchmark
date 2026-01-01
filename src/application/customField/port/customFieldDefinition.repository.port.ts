import { CustomFieldDefinition } from '../../../domain/customField/customFieldDefinition.domain';

/**
 * CustomFieldDefinition Repository 인터페이스
 * - 서비스 레이어에서 사용
 * - 인프라 레이어에서 구현
 */
export interface CustomFieldDefinitionRepositoryPort {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<CustomFieldDefinition | null>;

  /**
   * apiName으로 조회
   */
  findByApiName(apiName: string): Promise<CustomFieldDefinition | null>;

  /**
   * 전체 목록 조회 (활성화된 것만)
   */
  findAllActive(): Promise<CustomFieldDefinition[]>;

  /**
   * 저장 (생성 또는 업데이트)
   */
  save(definition: CustomFieldDefinition): Promise<void>;

  /**
   * 삭제
   */
  delete(id: string): Promise<void>;
}

export const CUSTOM_FIELD_DEFINITION_REPOSITORY = Symbol(
  'CustomFieldDefinitionRepositoryPort',
);
