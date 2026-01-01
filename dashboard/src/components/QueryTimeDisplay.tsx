interface QueryTimeDisplayProps {
  queryTime: number;
  dataSource: 'mysql' | 'es';
  total: number;
}

/**
 * 쿼리 실행 시간 표시
 */
export function QueryTimeDisplay({
  queryTime,
  dataSource,
  total,
}: QueryTimeDisplayProps) {
  const isSlowQuery = queryTime > 1000;
  const isMysql = dataSource === 'mysql';

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-gray-600">
        전체 <span className="font-semibold">{total.toLocaleString()}</span>건
      </span>
      <span
        className={`rounded-full px-3 py-1 ${
          isSlowQuery
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {queryTime.toLocaleString()}ms
        {isMysql && isSlowQuery && ' (EAV 느림)'}
      </span>
      <span
        className={`rounded-full px-2 py-1 text-xs ${
          isMysql ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {isMysql ? 'MySQL' : 'ES'}
      </span>
    </div>
  );
}
