'use client';

interface DataSourceToggleProps {
  value: 'mysql' | 'es';
  onChange: (value: 'mysql' | 'es') => void;
}

/**
 * MySQL / Elasticsearch 데이터 소스 토글
 */
export function DataSourceToggle({ value, onChange }: DataSourceToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => onChange('mysql')}
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          value === 'mysql'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        MySQL (EAV)
      </button>
      <button
        onClick={() => onChange('es')}
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          value === 'es'
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Elasticsearch
      </button>
    </div>
  );
}
