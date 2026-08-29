/**
 * 會員區與共用 UI 補充翻譯（會員中心、預約、聊天、通知、共用元件）
 * @module locales/memberExtra
 *
 * 分檔規則同 publicExtra.ts —— 只放會員區/共用 UI 的 namespace。
 */

export interface MemberExtraTranslations {
  /** 佔位：由 i18n 掃描補上實際 namespace 後移除 */
  _memberPlaceholder?: never;
}

export const memberExtra: {
  zhTW: MemberExtraTranslations;
  en: MemberExtraTranslations;
} = {
  zhTW: {},
  en: {},
};
