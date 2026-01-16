/**
 * 커스텀 필드 타입 Value Object
 * - TEXT: 텍스트
 * - NUMBER: 숫자
 * - DATE: 날짜 (YYYY-MM-DD)
 * - SELECT: 선택형 (옵션 목록에서 선택)
 */
export const FieldType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  DATE: 'DATE',
  SELECT: 'SELECT',
} as const;

export type FieldType = (typeof FieldType)[keyof typeof FieldType];

/**
 * 커스텀 필드 API 이름 suffix
 */
export const CUSTOM_FIELD_SUFFIX = '__c';

/**
 * 커스텀 필드인지 확인
 */
export function isCustomField(fieldName: string): boolean {
  return fieldName.endsWith(CUSTOM_FIELD_SUFFIX);
}
