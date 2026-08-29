/**
 * 公開站補充翻譯（首頁 sections、公開頁面）
 * @module locales/publicExtra
 *
 * ⚠️ 分檔規則：這個檔案只放「公開站」新增的翻譯 namespace，
 * 會員區放 memberExtra.ts、後台放 adminExtra.ts —— 三檔各自獨立、
 * 由 LanguageContext 統一 spread 合併，避免多人同改一個大字典檔。
 * namespace 命名請避開 LanguageContext.tsx 既有的 key（nav/common/theme/…）。
 */

/** 公開站補充翻譯的形狀（zh 與 en 必須同構） */
export interface PublicExtraTranslations {
  /** 佔位：由 i18n 掃描補上實際 namespace 後移除 */
  _publicPlaceholder?: never;
}

export const publicExtra: {
  zhTW: PublicExtraTranslations;
  en: PublicExtraTranslations;
} = {
  zhTW: {},
  en: {},
};
