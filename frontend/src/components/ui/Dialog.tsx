/**
 * 美化 Dialog 元件集合
 * @module components/ui/Dialog
 * @description 提供美化的對話框，取代原生 prompt、confirm、alert
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";

// ============ 共用樣式 ============

const overlayClasses =
  "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm modal-overlay-enter";
const modalClasses =
  "bg-luxe-surface border border-luxe-gold/30 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden modal-content-enter";
const headerClasses = "px-6 py-4 border-b border-luxe-gold/20 bg-luxe-black/50";
const contentClasses = "px-6 py-4";
const footerClasses =
  "px-6 py-4 border-t border-luxe-gold/20 flex justify-end gap-3";

// ============ 基礎 Modal ============

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "abyss" | "prism" | "luxe";
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC 關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen && typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyDown);
      }
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, onClose]);

  // 點擊背景關閉
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // 只在客戶端掛載後才渲染，避免 SSR 水合問題
  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return createPortal(
    <div className={overlayClasses} onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={`${modalClasses} ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={headerClasses}>
            <h3 className="text-lg font-medium text-luxe-gold">{title}</h3>
          </div>
        )}
        <div className={contentClasses}>{children}</div>
        {footer && <div className={footerClasses}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

// ============ Prompt Dialog ============

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "text" | "url";
  /** URL 驗證函數（舊版相容） */
  validateUrl?: (url: string) => boolean;
  /** 驗證錯誤訊息（舊版相容） */
  validationError?: string;
  /** 通用驗證函數：返回 null 表示有效，返回字串表示錯誤訊息 */
  validation?: (value: string) => string | null;
  /** 是否顯示預覽 */
  showPreview?: boolean;
  /** 預覽渲染函數 */
  renderPreview?: (value: string) => React.ReactNode;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = "",
  defaultValue = "",
  confirmText = "確定",
  cancelText = "取消",
  type = "text",
  validateUrl,
  validationError = "請輸入有效的網址",
  validation,
  // showPreview 為舊版相容保留，現在 renderPreview 總是會顯示
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showPreview: _showPreview = false,
  renderPreview,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  // 統一驗證邏輯
  const getValidationError = useCallback(
    (val: string): string | null => {
      if (!val.trim()) return null; // 空值不驗證
      if (validation) {
        return validation(val);
      }
      if (validateUrl && !validateUrl(val)) {
        return validationError;
      }
      return null;
    },
    [validation, validateUrl, validationError],
  );

  const handleConfirm = () => {
    if (!value.trim()) {
      setError("請輸入內容");
      return;
    }
    const validationErr = getValidationError(value);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    onConfirm(value.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
  };

  // 即時驗證
  const currentError = value.trim() ? getValidationError(value) : null;
  const isValid = !currentError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!value.trim() || !isValid}
            className="px-4 py-2 text-sm bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {confirmText}
          </button>
        </>
      }
    >
      {message && <p className="text-gray-300 text-sm mb-4">{message}</p>}

      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError("");
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-luxe-bg border rounded-lg outline-none text-sm transition-colors ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-luxe-gold/30 focus:border-luxe-gold"
        }`}
      />

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {/* 即時驗證警告（非 error，顯示當前驗證狀態） */}
      {currentError && !error && (
        <p className="text-amber-400 text-xs mt-2 whitespace-pre-line">
          {currentError}
        </p>
      )}

      {/* 預覽區域（無論 showPreview 設定，只要有 renderPreview 就顯示） */}
      {value.trim() && renderPreview && (
        <div className="mt-4">{renderPreview(value)}</div>
      )}
    </Modal>
  );
};

// ============ Confirm Dialog ============

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = "確定",
  cancelText = "取消",
  variant,
  danger,
}) => {
  // 向後兼容：onCancel 作為 onClose 的別名，danger 作為 variant 的別名
  const handleClose = onClose || onCancel || (() => {});
  const resolvedVariant = variant || (danger ? "danger" : "default");

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium ${
              resolvedVariant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-luxe-gold hover:bg-luxe-gold/90 text-black"
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-gray-300">{message}</p>
    </Modal>
  );
};

// ============ Alert Dialog ============

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
}) => {
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${icons[type]} ${title}`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90 font-medium"
        >
          確定
        </button>
      }
    >
      <p className="text-gray-300">{message}</p>
    </Modal>
  );
};

// ============ Dialog Context (全域使用) ============

interface DialogContextType {
  prompt: (
    options: Omit<PromptDialogProps, "isOpen" | "onClose" | "onConfirm">,
  ) => Promise<string | null>;
  confirm: (
    options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">,
  ) => Promise<boolean>;
  alert: (
    options: Omit<AlertDialogProps, "isOpen" | "onClose">,
  ) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

interface DialogState {
  type: "prompt" | "confirm" | "alert" | null;
  props: any;
  resolve: ((value: any) => void) | null;
}

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialog, setDialog] = useState<DialogState>({
    type: null,
    props: {},
    resolve: null,
  });

  const closeDialog = useCallback(() => {
    setDialog({ type: null, props: {}, resolve: null });
  }, []);

  const prompt = useCallback(
    (options: Omit<PromptDialogProps, "isOpen" | "onClose" | "onConfirm">) => {
      return new Promise<string | null>((resolve) => {
        setDialog({
          type: "prompt",
          props: {
            ...options,
            onConfirm: (value: string) => {
              resolve(value);
              closeDialog();
            },
          },
          resolve: () => {
            resolve(null);
            closeDialog();
          },
        });
      });
    },
    [closeDialog],
  );

  const confirm = useCallback(
    (options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">) => {
      return new Promise<boolean>((resolve) => {
        setDialog({
          type: "confirm",
          props: {
            ...options,
            onConfirm: () => {
              resolve(true);
              closeDialog();
            },
          },
          resolve: () => {
            resolve(false);
            closeDialog();
          },
        });
      });
    },
    [closeDialog],
  );

  const alert = useCallback(
    (options: Omit<AlertDialogProps, "isOpen" | "onClose">) => {
      return new Promise<void>((resolve) => {
        setDialog({
          type: "alert",
          props: options,
          resolve: () => {
            resolve();
            closeDialog();
          },
        });
      });
    },
    [closeDialog],
  );

  const contextValue = useMemo(
    () => ({ prompt, confirm, alert }),
    [prompt, confirm, alert],
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {/* Prompt Dialog */}
      {dialog.type === "prompt" && (
        <PromptDialog
          isOpen={true}
          onClose={() => dialog.resolve?.(null)}
          {...dialog.props}
        />
      )}

      {/* Confirm Dialog */}
      {dialog.type === "confirm" && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => dialog.resolve?.(false)}
          {...dialog.props}
        />
      )}

      {/* Alert Dialog */}
      {dialog.type === "alert" && (
        <AlertDialog
          isOpen={true}
          onClose={() => {
            if (dialog.resolve) dialog.resolve(undefined);
          }}
          {...dialog.props}
        />
      )}
    </DialogContext.Provider>
  );
};

/**
 * 使用美化 Dialog 的 Hook
 *
 * @example
 * ```tsx
 * const { prompt, confirm, alert } = useDialog();
 *
 * // Prompt
 * const url = await prompt({
 *   title: "輸入圖片網址",
 *   placeholder: "https://res.cloudinary.com/...",
 *   validateUrl: isValidCloudinaryUrl,
 * });
 *
 * // Confirm
 * const confirmed = await confirm({
 *   title: "確認刪除",
 *   message: "確定要刪除嗎？",
 *   variant: "danger",
 * });
 *
 * // Alert
 * await alert({
 *   title: "成功",
 *   message: "已儲存！",
 *   type: "success",
 * });
 * ```
 */
export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};

export default {
  Modal,
  PromptDialog,
  ConfirmDialog,
  AlertDialog,
  DialogProvider,
  useDialog,
};
