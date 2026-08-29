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
import { useScrollLock } from "@/hooks/useScrollLock";
import { useOverlayEscape } from "@/hooks/useOverlayEscape";
import { useLanguage } from "@/context/LanguageContext";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// ============ 共用樣式 ============

/* 捲動由這層遮罩負責（內容層刻意不夾 overflow，見下方 contentClasses）。
 * modal-scroll 切斷捲動鏈，捲到底不會再帶動底下的頁面／主內容容器。 */
const overlayClasses =
  "fixed inset-0 modal-layer modal-scroll flex items-start justify-center overflow-y-auto py-6 sm:py-10 bg-black/70 backdrop-blur-sm";
/** 用 surface-2（modal/popover 層）讓 modal 跟頁面 bg-surface 在淺色與深色都有對比 */
const modalClasses =
  "bg-surface-2 border border-gold/30 rounded-xl shadow-2xl w-full mx-3 sm:mx-4 overflow-visible my-auto text-inherit relative";
const headerClasses =
  "px-4 sm:px-6 py-3 sm:py-4 border-b border-gold/20 rounded-t-xl";
/** 內容不再 overflow-clip — 讓 popover/dropdown 可以溢出顯示。
 *  超長時靠 viewport 自身的 overlay scroll 處理。*/
const contentClasses = "px-4 sm:px-6 py-3 sm:py-4";
const footerClasses =
  "px-4 sm:px-6 py-3 sm:py-4 border-t border-gold/20 flex flex-wrap justify-end gap-2 sm:gap-3";

// ============ 基礎 Modal ============

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  theme?: string;
  className?: string;
  /**
   * 新手導覽用的彈窗識別碼（frontend/src/tours/）。
   * 給了之後面板會帶上 `data-tour-modal="<id>"`，導覽引擎就能等它出現、
   * 在裡面繼續導覽欄位，走完再自動關閉。
   * 本元件沒有 × 關閉鈕，導覽會改用 Escape 收掉（上面的 keydown 監聽會接住）。
   */
  tourId?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  tourId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useScrollLock(isOpen);

  /*
   * ESC 關閉 —— 走共用堆疊，疊層時只關最上面那一層。
   * （以前每層各自監聽 window，按一次 Escape 會把好幾層一起收掉。）
   */
  useOverlayEscape(isOpen, onClose);

  // 點擊背景關閉
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // 只在客戶端掛載後才渲染，避免 SSR 水合問題
  if (!mounted || typeof document === "undefined") return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-[900px]",
    full: "max-w-[95vw] sm:max-w-[1440px]",
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={overlayClasses}
          onClick={handleBackdropClick}
          /*
           * 新手導覽關閉此彈窗的首選手段：直接 click 這層背景。
           * 本元件沒有 × 鈕，導覽若改送 Escape，driver.js 也會收到同一顆 Escape
           * 而把整段導覽一起關掉 —— 點背景才只關彈窗、不影響導覽。
           */
          data-tour-modal-backdrop=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            ref={modalRef}
            data-tour-modal={tourId}
            className={`${modalClasses} ${sizeClasses[size]}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {title && (
              <div className={headerClasses}>
                <h3 className="text-lg font-medium text-gold">{title}</h3>
              </div>
            )}
            <div className={contentClasses}>{children}</div>
            {footer && <div className={footerClasses}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
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
  confirmText,
  cancelText,
  type = "text",
  validateUrl,
  validationError,
  validation,
  // showPreview 為舊版相容保留，現在 renderPreview 總是會顯示
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showPreview: _showPreview = false,
  renderPreview,
}) => {
  const { t } = useLanguage();
  const resolvedConfirmText = confirmText ?? t.common.confirm;
  const resolvedCancelText = cancelText ?? t.common.cancel;
  const resolvedValidationError = validationError ?? t.uiCommon.invalidUrl;
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
        return resolvedValidationError;
      }
      return null;
    },
    [validation, validateUrl, resolvedValidationError],
  );

  const handleConfirm = () => {
    if (!value.trim()) {
      setError(t.uiCommon.inputRequired);
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
            className="px-4 py-2 text-sm text-muted hover:text-inherit transition-colors"
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!value.trim() || !isValid}
            className="px-4 py-2 text-sm bg-gold text-black rounded-lg hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {resolvedConfirmText}
          </button>
        </>
      }
    >
      {message && <p className="text-inherit opacity-85 text-sm mb-4">{message}</p>}

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
        className={`studio-input w-full px-4 py-3 border rounded-lg outline-none text-sm transition-colors ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gold/30 focus:border-gold"
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
  confirmText,
  cancelText,
  variant,
  danger,
}) => {
  const { t } = useLanguage();
  const resolvedConfirmText = confirmText ?? t.common.confirm;
  const resolvedCancelText = cancelText ?? t.common.cancel;
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
            className="px-4 py-2 text-sm text-muted hover:text-inherit transition-colors"
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium ${
              resolvedVariant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gold hover:bg-gold/90 text-black"
            }`}
          >
            {resolvedConfirmText}
          </button>
        </>
      }
    >
      <p className="text-inherit opacity-85">{message}</p>
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
          className="px-4 py-2 text-sm bg-gold text-black rounded-lg hover:bg-gold/90 font-medium"
        >
          確定
        </button>
      }
    >
      <p className="text-inherit opacity-85">{message}</p>
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
 * // ⚠️ 圖片欄位請改用 <ImageInput> / <ImagePickerModal>（支援上傳＋網址雙模式），
 * //    不要用 prompt 收圖片網址。
 * const url = await prompt({
 *   title: "輸入網址",
 *   placeholder: "https://...",
 *   validateUrl: (v) => /^https?:\/\//.test(v),
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
