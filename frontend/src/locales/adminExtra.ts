/**
 * 後台補充翻譯（admin 頁面、教學導覽）
 * @module locales/adminExtra
 *
 * 分檔規則同 publicExtra.ts —— 只放後台/導覽的 namespace。
 */

export interface AdminExtraTranslations {
  /** 佔位：由 i18n 掃描補上實際 namespace 後移除 */
  _adminPlaceholder?: never;
}

export const adminExtra: {
  zhTW: AdminExtraTranslations;
  en: AdminExtraTranslations;
} = {
  zhTW: {},
  en: {},
};
