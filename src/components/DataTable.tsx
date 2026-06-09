import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: number;
  sortable?: boolean;
  render?: (value: T[keyof T] | undefined, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  total?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T, index: number) => void;
  rowKey?: keyof T | ((row: T) => string);
  emptyText?: string;
  className?: string;
}

function getValue<T>(row: T, key: keyof T | string): T[keyof T] | undefined {
  if (typeof key === 'string') {
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value as T[keyof T] | undefined;
  }
  return row[key];
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  pagination = true,
  pageSize = 10,
  total,
  currentPage: controlledPage,
  onPageChange,
  onRowClick,
  rowKey = 'id' as keyof T,
  emptyText = '暂无数据',
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [internalPage, setInternalPage] = useState(1);

  const currentPage = controlledPage ?? internalPage;
  const setCurrentPage = onPageChange ?? setInternalPage;
  const dataTotal = total ?? data.length;

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);

      return sortOrder === 'asc'
        ? aStr.localeCompare(bStr, 'zh-CN')
        : bStr.localeCompare(aStr, 'zh-CN');
    });
  }, [data, sortKey, sortOrder]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(dataTotal / pageSize);

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    const value = row[rowKey];
    return value !== undefined ? String(value) : String(index);
  };

  const renderPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn('rounded-xl border border-slate-800/50 bg-slate-900/50 overflow-hidden', className)}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50 bg-slate-800/30">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400',
                    col.sortable && 'cursor-pointer select-none hover:bg-slate-800/50 transition-colors',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5 inline-flex">
                    <span>{col.title}</span>
                    {col.sortable && (
                      <span className="inline-flex flex-col -space-y-1">
                        <ChevronUp
                          size={12}
                          className={cn(
                            sortKey === col.key && sortOrder === 'asc'
                              ? 'text-cyan-400'
                              : 'text-slate-600'
                          )}
                        />
                        <ChevronDown
                          size={12}
                          className={cn(
                            sortKey === col.key && sortOrder === 'desc'
                              ? 'text-cyan-400'
                              : 'text-slate-600'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {loading && paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    <span className="text-slate-500 text-sm">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-slate-500">{emptyText}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const absoluteIndex = (currentPage - 1) * pageSize + index;
                return (
                  <tr
                    key={getRowKey(row, absoluteIndex)}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-slate-800/30',
                      index % 2 === 0 ? 'bg-slate-900/20' : 'bg-transparent'
                    )}
                    onClick={() => onRowClick?.(row, absoluteIndex)}
                  >
                    {columns.map((col) => {
                      const value = getValue(row, col.key);
                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            'px-4 py-3.5 text-sm text-slate-300',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right'
                          )}
                        >
                          {col.render ? col.render(value, row, absoluteIndex) : String(value ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-800/20 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            共 <span className="text-slate-300 font-medium">{dataTotal}</span> 条，
            第 <span className="text-slate-300 font-medium">{currentPage}</span> /
            <span className="text-slate-300 font-medium">{totalPages}</span> 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === 1 || loading
                  ? 'text-slate-700 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <ChevronLeft size={16} />
            </button>

            {renderPages().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...' || loading}
                className={cn(
                  'min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-all',
                  page === currentPage
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                    : page === '...'
                    ? 'text-slate-600 cursor-default'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === totalPages || loading
                  ? 'text-slate-700 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
