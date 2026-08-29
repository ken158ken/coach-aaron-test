/**
 * ImagePickerModal — 用 ImageInput 選一張圖並回傳網址
 * @module components/ui/ImagePickerModal
 *
 * @description
 * 取代原本「插入圖片」用的 `dialog.prompt()` 純文字輸入框：
 * 那個做法只能貼 Cloudinary 網址、沒有上傳、沒有拖放。
 * 這裡直接嵌 ImageInput，兩種來源共用同一套驗證與 UI。
 *
 * 用法：
 *   const [open, setOpen] = useState(false);
 *   <ImagePickerModal isOpen={open} onClose={() => setOpen(false)}
 *     entity="article" entityKey={id} kind="content"
 *     onConfirm={(url) => editor.chain().focus().insertContent(...).run()} />
 */

import React, { useEffect, useState } from "react";
import Modal from "./overlay/Modal";
import PillButton from "./buttons/PillButton";
import ImageInput, { type ImageEntity, type ImageKind } from "./ImageInput";

export interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 按下「插入」時回傳選定的圖片網址 */
  onConfirm: (url: string) => void;
  entity: ImageEntity;
  entityKey?: string | number | null;
  kind?: ImageKind;
  title?: string;
  /** 預覽比例；插圖預設寬螢幕比例 */
  aspectHint?: string;
  confirmText?: string;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entity,
  entityKey = null,
  kind = "content",
  title = "插入圖片",
  aspectHint = "16 / 9",
  confirmText = "插入",
}) => {
  const [url, setUrl] = useState("");

  // 每次開啟都從空白開始，避免帶入上一次插入的圖
  useEffect(() => {
    if (isOpen) setUrl("");
  }, [isOpen]);

  const handleConfirm = () => {
    if (!url.trim()) return;
    onConfirm(url.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} theme="luxe" size="lg">
      <div className="space-y-4">
        <ImageInput
          value={url}
          onChange={setUrl}
          entity={entity}
          entityKey={entityKey}
          kind={kind}
          aspectHint={aspectHint}
        />
        <div className="flex justify-end gap-3 pt-1">
          <PillButton theme="luxe" variant="outline" onClick={onClose}>
            取消
          </PillButton>
          <PillButton
            theme="luxe"
            variant="filled"
            onClick={handleConfirm}
            disabled={!url.trim()}
          >
            {confirmText}
          </PillButton>
        </div>
      </div>
    </Modal>
  );
};

export default ImagePickerModal;
