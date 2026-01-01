/**
 * Contact 생성 DTO
 */
export interface CreateContactDto {
  email: string;
  name: string;
  customFields?: Record<string, string | number | Date>;
}
