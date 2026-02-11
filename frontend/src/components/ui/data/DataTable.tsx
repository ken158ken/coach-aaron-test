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
  header: string;
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
  theme?: "abyss" | "prism" | "luxe";
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  /** 啟用欄位排序功能 */
  sortable?: boolean;
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
  theme = "luxe",
  loading = false,
  emptyMessage = "沒有資料",
  className = "",
  sortable = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const themes = {
    abyss: {
      container: "bg-abyss-bg/30 border-abyss-accent/20",
      header: "bg-abyss-bg/50 text-abyss-text/70 border-abyss-accent/20",
      row: "border-abyss-accent/10 hover:bg-abyss-accent/10 transition-all duration-200",
      text: "text-abyss-text",
      muted: "text-abyss-text/60",
      card: "bg-abyss-bg/40 border-abyss-accent/20 hover:border-abyss-accent/40 hover:shadow-md transition-all duration-300",
      sortActive: "text-abyss-accent",
    },
    prism: {
      container: "bg-prism-bg/30 border-prism-accent/20",
      header: "bg-prism-bg/50 text-prism-text/70 border-prism-accent/20",
      row: "border-prism-accent/10 hover:bg-prism-accent/10 transition-all duration-200",
      text: "text-prism-text",
      muted: "text-prism-text/60",
      card: "bg-prism-bg/40 border-prism-accent/20 hover:border-prism-accent/40 hover:shadow-md transition-all duration-300",
      sortActive: "text-prism-accent",
    },
    luxe: {
      container: "bg-luxe-surface border-luxe-gold/10",
      header: "bg-luxe-bg text-luxe-muted border-luxe-gold/10",
      row: "border-luxe-gold/5 hover:bg-luxe-gold/10 transition-all duration-200",
      text: "text-luxe-text",
      muted: "text-luxe-muted",
      card: "bg-luxe-surface border-luxe-gold/10 hover:border-luxe-gold/30 hover:shadow-lg hover:shadow-luxe-gold/5 transition-all duration-300",
      sortActive: "text-luxe-gold",
    },
  };

  const styles = themes[theme];

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
        className={`ml-1 inline-flex flex-col text-[10px] leading-none ${isActive ? styles.sortActive : "opacity-30"}`}
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
      <div className={`rounded-lg border ${styles.container} ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={`rounded-lg border ${styles.container} ${className}`}>
        <div className={`px-4 py-12 text-center ${styles.text}`}>
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

  return (
    <>
      {/* 桌面版表格 */}
      <div
        className={`hidden md:block rounded-lg border overflow-hidden ${styles.container} ${className}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${styles.header}`}>
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
                    ${styles.row}
                    ${onRowClick ? "cursor-pointer" : ""}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 text-sm ${styles.text} ${column.className || ""}`}
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
        {sortedData.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`
              p-4 rounded-lg border
              ${styles.card}
              ${onRowClick ? "cursor-pointer active:scale-[0.98]" : ""}
              transition-transform
            `}
          >
            {/* 主要資訊 + 操作按鈕 */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className={`font-medium ${styles.text}`}>
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

            {/* 次要資訊 */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {secondaryColumns.slice(0, 4).map((column) => (
                <div key={String(column.key)}>
                  <span className={`${styles.muted} text-xs`}>
                    {column.header}
                  </span>
                  <div className={styles.text}>
                    {column.render
                      ? column.render(item)
                      : String(getValue(item, String(column.key)) ?? "-")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DataTable;
