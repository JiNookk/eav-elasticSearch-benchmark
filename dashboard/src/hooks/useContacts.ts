'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchContacts, fetchCustomFields } from '@/lib/api';
import type { ContactsRequest } from '@/types/contact';

/**
 * Contact 목록 조회 훅
 */
export function useContacts(params: ContactsRequest) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => fetchContacts(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * 커스텀 필드 정의 조회 훅
 */
export function useCustomFields() {
  return useQuery({
    queryKey: ['customFields'],
    queryFn: fetchCustomFields,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
