'use client';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

/**
 * 테이블 페이지네이션
 */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // 페이지 번호 생성 (최대 5개)
  const getPageNumbers = () => {
    const pages: number[] = [];
    let startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
      {/* 좌측: 페이지 정보 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          <span className="font-medium">{start.toLocaleString()}</span>
          {' - '}
          <span className="font-medium">{end.toLocaleString()}</span>
          {' / '}
          <span className="font-medium">{total.toLocaleString()}</span>건
        </span>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}건
            </option>
          ))}
        </select>
      </div>

      {/* 우측: 페이지 네비게이션 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {'<<'}
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {'<'}
        </button>

        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`rounded-md px-3 py-1 text-sm ${
              pageNum === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {'>'}
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );
}
