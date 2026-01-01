/**
 * Contact 검색 DTO
 */
export interface SearchContactsDto {
  // 데이터 소스
  dataSource: 'mysql' | 'es';

  // 페이지네이션
  page: number;
  pageSize: number;

  // 검색
  search?: string;

  // 정렬
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];

  // 필터
  filter?: {
    field: string;
    operator: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
    value: string | number | [number, number];
  }[];

  // 그루핑
  groupBy?: string;
}

/**
 * Contact 검색 응답
 */
export interface SearchContactsResponse {
  data: ContactResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  queryTime: number; // ms
  dataSource: 'mysql' | 'es';
  // 그루핑 결과 (groupBy 사용 시)
  groups?: { key: string; count: number }[];
}

export interface ContactResponse {
  id: string;
  email: string;
  name: string;
  customFields: Record<string, string | number | Date | null>;
  createdAt: Date;
  updatedAt: Date;
}
