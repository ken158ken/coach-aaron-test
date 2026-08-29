/**
 * 首頁區塊對應表
 *
 * 把 site_content 的 content_key 對應到首頁的視覺區塊，
 * 讓 AdminContent 頁可以按「區塊」而非平坦清單呈現。
 *
 * 本檔只留「不隨語言變動」的資料：id / icon / content_keys / targetTab。
 * 顯示字串（標題、副標、說明、提示條）全部在
 * `locales/adminExtra.ts` 的 `homepageSections` namespace，
 * 呼叫端以 id 查 `t.homepageSections[section.id]`。
 *
 * 新增 content_key 時：
 *   1. 在對應 section.keys 陣列加入該 key
 *   2. 若是新區塊，在 HOMEPAGE_SECTIONS 末尾加入新 entry，
 *      並在 HomepageSectionId 與 adminExtra 的 `homepageSections`
 *      （中英兩份）補上同名 key —— 少一邊會直接編譯失敗
 *
 * @module utils/homepageSections
 */

/**
 * 首頁區塊識別碼
 *
 * 同時是 `t.homepageSections` 的 key，故兩邊必須一一對應。
 */
export type HomepageSectionId =
  | 'hero'
  | 'coach_intro'
  | 'services'
  | 'testimonial'
  | 'moments'
  | 'career'
  | 'podcast'
  | 'gallery'
  | 'certifications';

/** 單一首頁區塊定義（僅結構資料，文案見 adminExtra.homepageSections） */
export interface HomepageSection {
  /** 區塊在 AdminContent 中的內部識別碼，也是查字典用的 key */
  id: HomepageSectionId;
  /** emoji / 圖示 */
  icon: string;
  /** 此區塊涵蓋的 content_keys（依 site_content 表） */
  keys: string[];
  /**
   * 提示條上的「前往 →」要跳到哪個 admin tab
   * （提示條文字本身是 `t.homepageSections[id].hint`，空字串代表不顯示提示條）
   */
  targetTab?: 'testimonial' | 'gallery' | 'popup' | 'marquee' | 'podcast';
}

/**
 * 首頁區塊清單（依首頁從上到下順序）
 *
 * 2026-07 首頁改版後的順序：
 *   Hero → 關於教練 → 主要服務項目與專長 → 真實學員留言 → Moments
 *   → 其他人設經歷 → Podcast → Credentials 專業認證
 *
 * 註：`review_tagline` / `review_title` / `review_subtitle` 三個 key
 *     在「學員真實評價」區塊併入「學員見證」後已無元件讀取。
 *     DB 資料刻意保留（客戶可能編輯過），但不再列於此清單，
 *     因此會被歸到 AdminContent 的 "others" 群組。
 */
export const HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'hero',
    icon: '🎬',
    keys: [
      'hero_title',
      'hero_subtitle',
      'hero_flip_words',
      'hero_cta_primary',
      'hero_cta_secondary',
    ],
  },
  {
    id: 'coach_intro',
    icon: '👤',
    keys: [
      'coach_intro_tagline',
      'coach_intro_name',
      'coach_intro_title',
      'coach_intro_image_url',
      'about_coach',
      'coach_intro_bullets',
      'coach_intro_cta',
    ],
  },
  {
    id: 'services',
    icon: '🎯',
    keys: ['services_tagline', 'services_title', 'services_subtitle'],
  },
  {
    id: 'testimonial',
    icon: '🏆',
    keys: ['testimonial_tagline', 'testimonial_title', 'testimonial_subtitle'],
    targetTab: 'testimonial',
  },
  {
    id: 'moments',
    icon: '📸',
    keys: ['moments_tagline', 'moments_title', 'moments_subtitle'],
    targetTab: 'gallery',
  },
  {
    id: 'career',
    icon: '🧭',
    keys: ['career_tagline', 'career_title', 'career_subtitle'],
  },
  {
    id: 'podcast',
    icon: '🎙',
    keys: ['podcast_tagline', 'podcast_title', 'podcast_subtitle'],
    targetTab: 'podcast',
  },
  {
    id: 'gallery',
    icon: '🖼',
    keys: ['gallery_tagline', 'gallery_title', 'gallery_subtitle'],
    targetTab: 'gallery',
  },
  {
    id: 'certifications',
    icon: '🏅',
    keys: [],
    targetTab: 'marquee',
  },
];

/**
 * 建立 key → sectionId 的反查表，用來判斷某個 content_key 屬於哪個區塊。
 * 若某 key 不在任何 section（例如手動新增的），會被歸到 "others"。
 */
export const KEY_TO_SECTION_ID: Record<string, HomepageSectionId> = (() => {
  const map: Record<string, HomepageSectionId> = {};
  for (const section of HOMEPAGE_SECTIONS) {
    for (const key of section.keys) {
      map[key] = section.id;
    }
  }
  return map;
})();

/**
 * 判斷 content_key 是否應以「圖片」型式呈現（即使 content_type 不是 image）
 * 用於向下相容：以 _url、_image、image_url 結尾的 key 視為圖片欄位
 */
export function isImageKey(key: string): boolean {
  return /(_url|_image|image_url)$/i.test(key);
}

/**
 * 判斷 content_key 是否應以「JSON 陣列編輯器」呈現
 * 用於向下相容：以 _bullets、_list、_items 結尾的 key 視為陣列欄位
 */
export function isArrayKey(key: string): boolean {
  return /(_bullets|_list|_items)$/i.test(key);
}
