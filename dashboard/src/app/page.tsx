'use client';

import { useState, useCallback } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { useContacts, useCustomFields } from '@/hooks/useContacts';
import { ContactsTable } from '@/components/ContactsTable';
import { DataSourceToggle } from '@/components/DataSourceToggle';
import { QueryTimeDisplay } from '@/components/QueryTimeDisplay';
import { SearchInput } from '@/components/SearchInput';
import { TablePagination } from '@/components/TablePagination';

export default function DashboardPage() {
  // 상태 관리
  const [dataSource, setDataSource] = useState<'mysql' | 'es'>('es');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // 정렬 상태를 API 포맷으로 변환
  const apiSort = sorting.map((s) => ({
    field: s.id,
    direction: s.desc ? ('desc' as const) : ('asc' as const),
  }));

  // 데이터 조회
  const { data: contactsData, isLoading } = useContacts({
    dataSource,
    page,
    pageSize,
    search: search || undefined,
    sort: apiSort.length > 0 ? apiSort : undefined,
  });

  const { data: customFields = [] } = useCustomFields();

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // 페이지 크기 변경 시 첫 페이지로
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1); // 검색 시 첫 페이지로
  }, []);

  const handleDataSourceChange = useCallback((value: 'mysql' | 'es') => {
    setDataSource(value);
    setPage(1); // 데이터 소스 변경 시 첫 페이지로
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contact Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                EAV (MySQL) vs Elasticsearch 성능 비교
              </p>
            </div>
            <DataSourceToggle
              value={dataSource}
              onChange={handleDataSourceChange}
            />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 툴바 */}
        <div className="mb-4 flex items-center justify-between">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="이름, 이메일 검색..."
          />

          {contactsData && (
            <QueryTimeDisplay
              queryTime={contactsData.queryTime}
              dataSource={contactsData.dataSource}
              total={contactsData.total}
            />
          )}
        </div>

        {/* 테이블 */}
        <ContactsTable
          data={contactsData?.data ?? []}
          customFields={customFields}
          sorting={sorting}
          onSortingChange={setSorting}
          isLoading={isLoading}
        />

        {/* 페이지네이션 */}
        {contactsData && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={contactsData.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </main>
    </div>
  );
}
