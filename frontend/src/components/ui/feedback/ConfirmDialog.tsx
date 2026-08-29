/**
 * 確認對話框元件
 * @module components/ui/feedback/ConfirmDialog
 */

import React from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

/**
 * ConfirmDialog - 確認對話框元件
 *
 * @param {boolean} isOpen - 是否開啟
 * @param {string} title - 標題
 * @param {string} message - 訊息內容
 * @param {Function} onConfirm - 確認回調
 * @param {Function} onCancel - 取消回調
 * @param {string} confirmText - 確認按鈕文字
 * @param {string} cancelText - 取消按鈕文字
 * @param {boolean} danger - 是否為危險操作
 * @returns {JSX.Element | null} 對話框
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "確認",
  cancelText = "取消",
  danger = false,
}) => {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6">
      {/* Backdrop with enhanced blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-luxe-surface border border-luxe-gold/20 rounded-lg p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4 shadow-2xl my-auto">
        <h3 className="text-lg font-medium text-luxe-text mb-2">{title}</h3>
        <p className="text-luxe-muted mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm text-luxe-muted hover:text-luxe-text transition-colors"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`
              px-4 py-2 text-sm rounded font-medium transition-colors
              ${
                danger
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                  : "bg-luxe-gold/20 text-luxe-gold hover:bg-luxe-gold/30 border border-luxe-gold/30"
              }
            `}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
