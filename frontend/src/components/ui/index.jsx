import { UI } from '../../lib/ui';

// 統計卡片
export const StatCard = ({ title, value, icon, description, trend }) => (
  <div className={`${UI.card.base} ${UI.spacing.card}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-base-content/60">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {description && (
          <p className="text-sm text-base-content/50 mt-1">{description}</p>
        )}
      </div>
      {icon && (
        <div className="text-4xl text-primary/30">{icon}</div>
      )}
    </div>
    {trend && (
      <div className={`mt-2 text-sm ${trend > 0 ? 'text-success' : 'text-error'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

// 資料表格
export const DataTable = ({ columns, data, onRowClick, emptyText = '暫無資料' }) => (
  <div className="overflow-x-auto">
    <table className={UI.table.base}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} className={col.className || ''}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center py-8 text-base-content/50">
              {emptyText}
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr 
              key={row.id || i} 
              className={onRowClick ? 'cursor-pointer hover:bg-base-200' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, j) => (
                <td key={j} className={col.cellClassName || ''}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// 狀態標籤
export const StatusBadge = ({ status, text }) => (
  <span className={UI.status[status] || 'badge badge-ghost'}>
    {text || status}
  </span>
);

// 確認對話框
export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = '確認', cancelText = '取消', danger = false }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{message}</p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button 
            className={danger ? 'btn btn-error' : 'btn btn-primary'} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel}></div>
    </div>
  );
};

// 載入中
export const LoadingSpinner = ({ size = 'md', text }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <span className={`loading loading-spinner loading-${size} text-primary`}></span>
    {text && <p className="mt-2 text-base-content/60">{text}</p>}
  </div>
);

// 空狀態
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-6xl text-base-content/20 mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-base-content/70">{title}</h3>
    {description && <p className="text-sm text-base-content/50 mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// 頁面標題
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-base-content/60 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

// 搜尋框
export const SearchInput = ({ value, onChange, placeholder = '搜尋...' }) => (
  <div className="form-control">
    <div className="input-group">
      <input
        type="text"
        placeholder={placeholder}
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button className="btn btn-square btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  </div>
);

// 切換開關
export const Toggle = ({ checked, onChange, label, disabled = false }) => (
  <label className="label cursor-pointer justify-start gap-3">
    <input 
      type="checkbox" 
      className="toggle toggle-primary" 
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    {label && <span className="label-text">{label}</span>}
  </label>
);
