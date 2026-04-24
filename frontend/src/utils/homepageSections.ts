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
    id: 'podcast',
    title: 'PODCAST 深海電台',
    tagline: 'Podcast Section',
    description: 'Podcast 區塊的標題、副標。',
    icon: '🎙',
    keys: ['podcast_tagline', 'podcast_title', 'podcast_subtitle'],
    hint: {
      text: '👉 單集內容（標題、描述、時長、分類…）請到「Podcast 單集」tab 管理',
      targetTab: 'podcast',
    },
  },
  {
    id: 'testimonial',
    title: '學員見證幻燈片',
    tagline: 'Student Reviews',
    description: '學員見證 coverflow 輪播的區塊標題與副標。',
    icon: '🏆',
    keys: ['testimonial_tagline', 'testimonial_title', 'testimonial_subtitle'],
    hint: {
      text: '👉 幻燈片內容（照片、姓名、見證文）請到「學員見證幻燈片」tab 管理',
      targetTab: 'testimonial',
    },
  },
  {
    id: 'review',
    title: '學員真實評價',
    tagline: 'Real Reviews',
    description:
      '學員真實評價 3 格同步切換區塊的標題與副標（共用學員見證資料）。',
    icon: '💬',
    keys: ['review_tagline', 'review_title', 'review_subtitle'],
    hint: {
      text: 'ℹ️ 此區塊共用「學員見證幻燈片」資料，改那邊這邊也會一起變',
      targetTab: 'testimonial',
    },
  },
  {
    id: 'gallery',
    title: 'GALLERY 相片記錄',
    tagline: 'Gallery Coverflow',
    description: '相片記錄 3D 輪播區塊的標題與副標。',
    icon: '🖼',
    keys: ['gallery_tagline', 'gallery_title', 'gallery_subtitle'],
    hint: {
      text: '👉 輪播照片請到「相片輪播」tab 管理',
      targetTab: 'gallery',
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
