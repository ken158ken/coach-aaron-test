// UI 常量 - 現代化銳利風格，無漸層
export const UI = {
  // 顏色主題
  colors: {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info',
  },
  
  // 背景顏色
  bg: {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    base100: 'bg-base-100',
    base200: 'bg-base-200',
    base300: 'bg-base-300',
    neutral: 'bg-neutral',
  },

  // 按鈕樣式
  btn: {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    accent: 'btn btn-accent',
    ghost: 'btn btn-ghost',
    outline: 'btn btn-outline',
    error: 'btn btn-error',
    success: 'btn btn-success',
    sm: 'btn-sm',
    lg: 'btn-lg',
    xs: 'btn-xs',
  },

  // 卡片樣式
  card: {
    base: 'card bg-base-100 shadow-md border border-base-300',
    compact: 'card bg-base-100 shadow-sm border border-base-300 compact',
    hover: 'card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow',
  },

  // 輸入框樣式
  input: {
    base: 'input input-bordered w-full',
    sm: 'input input-bordered input-sm w-full',
    error: 'input input-bordered input-error w-full',
  },

  // 表格樣式
  table: {
    base: 'table table-zebra w-full',
    compact: 'table table-compact table-zebra w-full',
  },

  // Badge 樣式
  badge: {
    primary: 'badge badge-primary',
    secondary: 'badge badge-secondary',
    accent: 'badge badge-accent',
    ghost: 'badge badge-ghost',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    error: 'badge badge-error',
    outline: 'badge badge-outline',
  },

  // 狀態顏色映射
  status: {
    published: 'badge badge-success',
    draft: 'badge badge-warning',
    archived: 'badge badge-ghost',
    pending: 'badge badge-warning',
    paid: 'badge badge-success',
    cancelled: 'badge badge-error',
    refunded: 'badge badge-info',
    active: 'badge badge-success',
    inactive: 'badge badge-ghost',
  },

  // 間距
  spacing: {
    section: 'py-8 px-4 lg:px-8',
    card: 'p-4 lg:p-6',
    compact: 'p-2 lg:p-4',
  },
};

// 狀態文字映射
export const STATUS_TEXT = {
  // 課程狀態
  published: '已發布',
  draft: '草稿',
  archived: '已封存',
  // 訂單狀態
  pending: '待付款',
  paid: '已付款',
  cancelled: '已取消',
  refunded: '已退款',
  // 通用狀態
  active: '啟用',
  inactive: '停用',
};

// 格式化函數
export const formatCurrency = (amount, currency = 'TWD') => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatDateShort = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};
