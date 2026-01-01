/**
 * Contact 수정 DTO
 */
export interface UpdateContactDto {
  name?: string;
  customFields?: Record<string, string | number | Date | null>;
}
