/**
 * Contact 관련 타입 정의
 */

export interface Contact {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  customFields: Record<string, string | number | Date | null>;
}

export interface ContactsRequest {
  // 데이터 소스
  dataSource: 'mysql' | 'es';

  // 페이지네이션
  page: number;
  pageSize: number;

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

  // 검색
  search?: string;

  // 그루핑
  groupBy?: string;
}

export interface ContactsResponse {
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
  queryTime: number; // 쿼리 실행 시간 (ms)
  dataSource: 'mysql' | 'es';
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  apiName: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  options: string[] | null;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
}
