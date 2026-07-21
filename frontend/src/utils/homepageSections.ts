/**
 * 首頁區塊對應表
 *
 * 把 site_content 的 content_key 對應到首頁的視覺區塊，
 * 讓 AdminContent 頁可以按「區塊」而非平坦清單呈現。
 *
 * 新增 content_key 時：
 *   1. 在對應 section.keys 陣列加入該 key
 *   2. 若是新區塊，在 HOMEPAGE_SECTIONS 末尾加入新 entry
 *
 * @module utils/homepageSections
 */

/** 單一首頁區塊定義 */
export interface HomepageSection {
  /** 區塊在 AdminContent 中的內部識別碼 */
  id: string;
  /** 顯示名稱（中文） */
  title: string;
  /** 英文副標（對照首頁上的 tagline） */
  tagline: string;
  /** 對應的首頁視覺描述，給管理員看 */
  description: string;
  /** emoji / 圖示 */
  icon: string;
  /** 此區塊涵蓋的 content_keys（依 site_content 表） */
  keys: string[];
  /** 跳轉到哪個 admin tab（若此區塊主要內容在別處管理） */
  hint?: {
    text: string;
    targetTab?: 'testimonial' | 'gallery' | 'popup' | 'marquee' | 'podcast';
  };
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
    title: 'Hero 主視覺',
    tagline: '首頁最上方大標',
    description: '首頁第一眼看到的主標語與副標，含 CTA 按鈕文字。',
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
    title: '教練介紹',
    tagline: 'About Coach',
    description: '教練照片、名字、職稱、自我介紹與認證清單。',
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
    title: '主要服務項目與專長',
    tagline: 'Services',
    description:
      '服務項目區塊的標題與副標。課程內容直接讀「課程管理」的資料，依分類自動分組。',
    icon: '🎯',
    keys: ['services_tagline', 'services_title', 'services_subtitle'],
    hint: {
      text: '👉 課程名稱、簡述、價格、分類請到「課程管理」頁編修（分類含「陪跑」「線上」「一對一」關鍵字會自動歸組）',
    },
  },
  {
    id: 'testimonial',
    title: '真實學員留言',
    tagline: 'Student Reviews',
    description:
      '學員見證區塊的標題與副標。可在「學員見證幻燈片」tab 切換三種版型（直立式／橫式／引言牆）。',
    icon: '🏆',
    keys: ['testimonial_tagline', 'testimonial_title', 'testimonial_subtitle'],
    hint: {
      text: '👉 幻燈片內容（照片、姓名、見證文）與版型切換請到「學員見證幻燈片」tab 管理',
      targetTab: 'testimonial',
    },
  },
  {
    id: 'moments',
    title: 'MOMENTS 精彩回顧',
    tagline: 'Moments Grid',
    description: '方向感知 hover 相片牆區塊的標題與副標（共用相片輪播資料）。',
    icon: '📸',
    keys: ['moments_tagline', 'moments_title', 'moments_subtitle'],
    hint: {
      text: 'ℹ️ 此區塊共用「相片輪播」資料，改那邊這邊也會一起變',
      targetTab: 'gallery',
    },
  },
  {
    id: 'career',
    title: '其他人設經歷',
    tagline: 'Career Path',
    description: '經歷輪播區塊的標題與副標（房仲業務、私人教練、總教官）。',
    icon: '🧭',
    keys: ['career_tagline', 'career_title', 'career_subtitle'],
    hint: {
      text: 'ℹ️ 三段經歷內容目前寫在程式中（CareerCarousel.tsx），尚未開放後台編輯',
    },
  },
  {
    id: 'podcast',
    title: 'PODCAST（首頁已不顯示）',
    tagline: 'Podcast Section',
    description:
      '⚠️ 此區塊已從首頁移除（podcast_episodes 無真實單集、僅顯示假的示範內容）。文案僅保留供日後恢復；改動不會影響首頁。若要恢復，需在「Podcast 單集」tab 新增真實單集並把區塊掛回首頁。',
    icon: '🎙',
    keys: ['podcast_tagline', 'podcast_title', 'podcast_subtitle'],
    hint: {
      text: '👉 單集內容請到「Podcast 單集」tab 管理（首頁目前不顯示 Podcast 區塊）',
      targetTab: 'podcast',
    },
  },
  {
    id: 'gallery',
    title: 'GALLERY 相片記錄（首頁已不顯示）',
    tagline: 'Gallery Coverflow',
    description:
      '⚠️ 此區塊已從首頁移除（與 MOMENTS 相片重複），文案僅用於後台預覽，改動不會影響首頁。',
    icon: '🖼',
    keys: ['gallery_tagline', 'gallery_title', 'gallery_subtitle'],
    hint: {
      text: '👉 照片本身仍由「相片輪播」tab 管理，並會顯示在首頁的 MOMENTS 區塊',
      targetTab: 'gallery',
    },
  },
  {
    id: 'certifications',
    title: '認證 / 成果 Marquee',
    tagline: 'Credentials Marquee',
    description: '兩列無限滾動的認證標章與成果數字。',
    icon: '🏅',
    keys: [],
    hint: {
      text: '👉 認證標章與成果數字請到「認證 / 成果 Marquee」tab 管理',
      targetTab: 'marquee',
    },
  },
];

/**
 * 建立 key → sectionId 的反查表，用來判斷某個 content_key 屬於哪個區塊。
 * 若某 key 不在任何 section（例如手動新增的），會被歸到 "others"。
 */
export const KEY_TO_SECTION_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {};
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
