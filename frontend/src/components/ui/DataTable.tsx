/**
 * 資料表格元件
 * @module components/ui/DataTable
 */

import React from "react";

export interface TableColumn<T = any> {
  header: string;
  accessor?: keyof T | string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyText?: string;
  className?: string;
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyText = "暫無資料",
  className = "",
}: DataTableProps<T>) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={col.headerClassName || ""}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-base-content/60"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={onRowClick ? "cursor-pointer hover:bg-base-200" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, j) => (
                  <td key={j} className={col.cellClassName || ""}>
                    {col.render
                      ? col.render(row)
                      : col.accessor
                      ? row[col.accessor]
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
