/**
 * DataTable 元件 - 響應式資料表格（支援排序）
 * 桌面顯示表格，手機顯示卡片
 * @module components/ui/data/DataTable
 */

import React, { useState, useMemo, useCallback } from "react";

/** 排序方向 */
type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  /** 純文字版 header，用於排序下拉選單（header 為 JSX 時必須提供） */
  headerText?: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  /** 是否在手機版隱藏此欄位 */
  hideOnMobile?: boolean;
  /** 是否為主要欄位（手機版會放大顯示） */
  isPrimary?: boolean;
  /** 是否可排序（需要 sortable 屬性啟用） */
  sortable?: boolean;
  /** 自訂排序取值函式 */
  sortValue?: (item: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  theme?: string;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  /** 啟用欄位排序功能 */
  sortable?: boolean;
  /** 新手導覽定位錨點（tours/ 用 `[data-tour="..."]` 找元素） */
  "data-tour"?: string;
}

/**
 * DataTable - 響應式資料表格元件（含排序）
 *
 * @param {DataTableProps} props - 元件屬性
 * @returns {JSX.Element} 資料表格
 */
function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyMessage = "沒有資料",
  className = "",
  sortable = false,
  "data-tour": dataTour,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);



  /** 取得巢狀物件值 */
  const getValue = useCallback((item: T, key: string): unknown => {
    const keys = key.split(".");
    let value: unknown = item;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value;
  }, []);

  /** 切換排序：null → asc → desc → null */
  const handleSort = useCallback(
    (column: Column<T>) => {
      if (!sortable) return;
      const colKey = String(column.key);
      // 排除操作欄
      if (colKey === "actions") return;
      // 只有標記 sortable 或全域 sortable 時可排序
      if (column.sortable === false) return;

      if (sortKey !== colKey) {
        setSortKey(colKey);
        setSortDir("asc");
      } else if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir(null);
      }
    },
    [sortable, sortKey, sortDir],
  );

  /** 排序後的資料 */
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;

    const col = columns.find((c) => String(c.key) === sortKey);
    return [...data].sort((a, b) => {
      const aVal = col?.sortValue ? col.sortValue(a) : getValue(a, sortKey);
      const bVal = col?.sortValue ? col.sortValue(b) : getValue(b, sortKey);

      // 數字比較
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      // 字串比較
      const aStr = String(aVal ?? "").toLowerCase();
      const bStr = String(bVal ?? "").toLowerCase();
      if (sortDir === "asc") return aStr.localeCompare(bStr, "zh-TW");
      return bStr.localeCompare(aStr, "zh-TW");
    });
  }, [data, sortKey, sortDir, columns, getValue]);

  /** 排序指示器 */
  const renderSortIcon = (column: Column<T>) => {
    if (!sortable) return null;
    const colKey = String(column.key);
    if (colKey === "actions" || column.sortable === false) return null;

    const isActive = sortKey === colKey;
    return (
      <span
        className={`ml-1 inline-flex flex-col text-[10px] leading-none ${isActive ? "text-white" : "opacity-30"}`}
      >
        <span
          className={
            isActive && sortDir === "asc" ? "opacity-100" : "opacity-40"
          }
        >
          ▲
        </span>
        <span
          className={
            isActive && sortDir === "desc" ? "opacity-100" : "opacity-40"
          }
        >
          ▼
        </span>
      </span>
    );
  };

  if (loading) {
    return (
      <div
        data-tour={dataTour}
        className={`rounded-lg border border-white/10 overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div
        data-tour={dataTour}
        className={`rounded-lg border border-white/10 overflow-hidden ${className}`}
      >
        <div className={`px-4 py-12 text-center text-white/80`}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  // 找出主要欄位和操作欄位
  const primaryColumn = columns.find((c) => c.isPrimary) || columns[0];
  const actionColumn = columns.find((c) => c.key === "actions");
  const secondaryColumns = columns.filter(
    (c) => c !== primaryColumn && c !== actionColumn && !c.hideOnMobile,
  );

  /*
   * 外層包一個版面中性的 div，只為了給新手導覽一個穩定的定位錨點：
   * 桌機表格與手機卡片是兩份 DOM（一份被 `hidden` 藏起來），
   * 若把 data-tour 同時掛在兩者上，querySelector 會抓到被隱藏的那份。
   */
  return (
    <div data-tour={dataTour}>
      {/* 桌面版表格 */}
      <div
        className={`hidden md:block rounded-lg border border-white/10 overflow-hidden ${className}`}
      >
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="relative">
              <tr className={`border-b bg-white/3 text-[#888] text-xs uppercase tracking-wider border-b border-white/10`}>
                {columns.map((column) => {
                  const colKey = String(column.key);
                  const canSort =
                    sortable &&
                    colKey !== "actions" &&
                    column.sortable !== false;
                  return (
                    <th
                      key={colKey}
                      onClick={() => canSort && handleSort(column)}
                      className={`px-4 py-3 text-left text-sm font-medium uppercase tracking-wider select-none ${
                        canSort ? "cursor-pointer hover:opacity-80" : ""
                      } ${column.className || ""}`}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {column.header}
                        {renderSortIcon(column)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    border-b
                    transition-colors
                    border-white/5 hover:bg-white/3 transition-all duration-200
                    ${onRowClick ? "cursor-pointer" : ""}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 text-sm text-white/80 ${column.className || ""}`}
                    >
                      {column.render
                        ? column.render(item)
                        : String(getValue(item, String(column.key)) ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 手機版卡片 */}
      <div className={`md:hidden space-y-3 ${className}`}>
        {/* 手機版排序選擇器 */}
        {sortable && (
          <div className="flex items-center gap-2 px-1">
            <span className={`text-xs text-[#888]`}>排序：</span>
            <select
              value={sortKey ? `${sortKey}:${sortDir}` : ""}
              onChange={(e) => {
                if (!e.target.value) {
                  setSortKey(null);
                  setSortDir(null);
                } else {
                  const [key, dir] = e.target.value.split(":");
                  setSortKey(key);
                  setSortDir(dir as SortDirection);
                }
              }}
              className={`text-xs rounded border px-2 py-1.5 bg-transparent text-[#888] border-[#c5a059]/20 focus:outline-none focus:border-[#c5a059]/50`}
            >
              <option value="">預設</option>
              {columns
                .filter(
                  (c) => String(c.key) !== "actions" && c.sortable !== false,
                )
                .map((c) => (
                  <React.Fragment key={String(c.key)}>
                    <option value={`${String(c.key)}:asc`}>
                      {c.headerText ?? c.header} ↑
                    </option>
                    <option value={`${String(c.key)}:desc`}>
                      {c.headerText ?? c.header} ↓
                    </option>
                  </React.Fragment>
                ))}
            </select>
          </div>
        )}

        {sortedData.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`
              p-3 sm:p-4 rounded-lg border
              studio-card
              ${onRowClick ? "cursor-pointer active:scale-[0.98]" : ""}
              transition-transform
            `}
          >
            {/* 主要資訊 + 操作按鈕 */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className={`font-medium min-w-0 break-words text-white/80`}>
                {primaryColumn.render
                  ? primaryColumn.render(item)
                  : String(getValue(item, String(primaryColumn.key)) ?? "")}
              </div>
              {actionColumn && (
                <div className="flex-shrink-0">
                  {actionColumn.render?.(item)}
                </div>
              )}
            </div>

            {/* 次要資訊 — 顯示全部（不再限制 4 個） */}
            {secondaryColumns.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                {secondaryColumns.map((column) => (
                  <div key={String(column.key)} className="min-w-0">
                    <span className={`text-[#888] text-xs`}>
                      {column.headerText ?? column.header}
                    </span>
                    <div className={`text-white/80 truncate`}>
                      {column.render
                        ? column.render(item)
                        : String(getValue(item, String(column.key)) ?? "-")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataTable;
