/**
 * 網站內容預設範本
 * 當 DB 無自定義內容時，前端隨機取用範本作為 fallback
 * 資料來源：教練雜資料.md (阿倫教官行銷素材)
 *
 * @module utils/contentTemplates
 */

/** 單一範本項目 */
export interface ContentTemplate {
  /** 範本名稱 */
  name: string;
  /** 範本內容 */
  value: string;
}

/** 各 content_key 的範本池 */
const CONTENT_TEMPLATES: Record<string, ContentTemplate[]> = {
  // ⚠️ hero_title 的第一行最後一個詞會被 HeroSection 的 flipWords 輪播替換，
  //    請務必讓關鍵字「私教變現」留在靜態部分（不要放在行末）。
  hero_title: [
    {
      // 定稿 A 案（推薦）：靜態「私教變現」＋ 輪播「系統／軍師／陪跑／實戰」
      name: "直球定位型 - 私教變現系統",
      value: "私教變現 系統\n把你的專業，變成穩定的收入",
    },
    {
      name: "品牌定位型 - 私教變現",
      value: "私教變現\n用銷售心理學 月入八萬↑",
    },
    {
      name: "專業權威型 - 十年實戰",
      value: "健身產業十年實戰\n把專業換成收入",
    },
    {
      // ⚠️「130 位教練」屬待佐證數字，客戶確認後才建議使用
      name: "數據成果型 - 130位教練",
      // 用「|」明確指定靜態前綴，避免行末的「教練」被輪播詞吃掉
      value: "成功協助 130 位教練|\n年收突破七位數",
    },
    {
      // 定稿 C 案：靜態「教練的」＋ 輪播「教練／軍師／後盾／陪跑員」
      name: "同行對同行型 - 教練的教練",
      value: "教練的 教練\n私教變現 × 銷售心理學，帶你走過我走過的路",
    },
    {
      name: "痛點切入型 - 收入停滯",
      value: "專業換不到業績？\n讓教練職涯徹底翻轉",
    },
  ],

  hero_subtitle: [
    {
      // 定稿新 A 案（推薦）
      name: "商業實戰培訓定位",
      value:
        "給私人教練的商業實戰培訓\n從體驗課成交、續約經營到個人品牌，一套可複製的變現系統",
    },
    {
      name: "銷售心理學定位",
      value: "結合心理學知識和實務銷售經驗\n讓專業轉化為看得見的收入",
    },
    {
      name: "三大核心承諾",
      value: "穩定月業績 20 萬 × 學生自然續約 × 自媒體精準獲客",
    },
    {
      // 定稿新 C 案（原「專業教學導向」為 B2C 文案，已改寫）
      name: "系統卡關導向",
      value:
        "專業夠了，卡住的通常是系統\n銷售心理學 × 陪跑輔導，帶教練把技術換成穩定業績",
    },
    {
      name: "溝通銷售導向",
      value: "教練最大的競爭力不在技術\n而在溝通、表達和行銷",
    },
    {
      name: "證照權威導向",
      value: "NSCA 美國肌力與體能 × TQUK 英國心理諮詢 × NLP 心理執行師",
    },
  ],

  about_coach: [
    {
      // 定稿新 A 案（推薦）：資歷＋定位並重
      name: "顧問定位版",
      value:
        "教練職涯培訓講師、私教變現顧問。第一線私教出身，現任台東威豪健身總教官，統籌約 50 人的教練團隊，負責業績與續約 KPI、教練育成與教學品質管理。十年產業經驗讓我很確定一件事：多數教練卡住的不是專業，是沒有一套把專業換成收入的系統。所以近年我把私教與管理的實戰方法整理成課程與陪跑，只教一件事——教練怎麼把技術變成穩定業績。",
    },
    {
      name: "完整經歷版",
      value:
        "在健身產業深耕 10 年，現任威豪健身總教官，帶領 50 人教練團隊。曾培訓超過 130 位教練年薪破百萬，累積教練培訓時數超過 1000 小時，主持百場企業內訓講座。持有 NSCA 美國肌力與體能、TQUK 英國心理諮詢師、NLP 心理執行師、Andaction 生活教練等專業認證。",
    },
    {
      name: "銷售導向版",
      value:
        "我是阿倫教官，在健身產業 10 年，我發現教練最大的競爭力不在技術，而在溝通、表達和行銷。我們結合心理學知識和實務銷售經驗，讓專業轉化為看得見的收入。成功協助 130 位教練，用銷售心理學技巧，100 天內月入 8 萬以上。",
    },
    {
      // 原「體適能教學版」為 B2C 文案（體態雕塑／增肌減脂／500 位學員），
      // 依定稿文案改寫為 B2B 對話感版（新 B 案）
      name: "對話感版",
      value:
        "你的專業應該值更多錢，這是我做這件事的全部理由。我從房仲業務轉行當私人教練，在第一線一堂課一堂課賣起，被拒絕過無數次；後來帶起 50 人的教練團隊，才真正看懂業績不是逼出來的，是設計出來的。現在我做的事很單純：把這套設計交給還在硬撐的教練。",
    },
    {
      name: "多元背景版",
      value:
        "從前永慶房屋單月兩百萬業績的房產經紀人，到 2019 年全國健身模特兒冠軍，再到威豪健身總教官 — 阿倫教官以跨界實戰經驗，將銷售心理學融入教練培訓，八年健身房管理經驗，打造出獨一無二的教練養成系統。",
    },
    {
      name: "精簡版",
      value:
        "阿倫教官，威豪健身總教官，帶領 50 人教練團隊。10 年健身產業實戰，培訓 130+ 教練年收破百萬，持有 NSCA、TQUK、NLP 國際認證。",
    },
  ],
};

/**
 * 取得指定 content_key 的所有範本
 *
 * @param {string} key - content_key
 * @returns {ContentTemplate[]} 範本陣列，若無對應 key 則回傳空陣列
 */
export function getTemplates(key: string): ContentTemplate[] {
  return CONTENT_TEMPLATES[key] || [];
}

/**
 * 取得指定 content_key 的第一個範本值（確定性，SSR-safe）
 * 用於 useState 初始值，避免 server/client Math.random() 不一致的 hydration 錯誤
 *
 * @param {string} key - content_key
 * @param {string} [fallback=""] - 若無任何範本時的最終 fallback 值
 * @returns {string} 第一個範本值
 */
export function getDefaultTemplate(key: string, fallback = ""): string {
  const templates = CONTENT_TEMPLATES[key];
  if (!templates || templates.length === 0) return fallback;
  return templates[0].value;
}

/**
 * 從指定 content_key 的範本池中隨機取得一個值
 * ⚠️ 不可用於 useState 初始值（會導致 SSR hydration mismatch）
 * 僅用於 useEffect 或事件處理器等客戶端專屬邏輯
 *
 * @param {string} key - content_key
 * @param {string} [fallback=""] - 若無任何範本時的最終 fallback 值
 * @returns {string} 隨機範本值
 */
export function getRandomTemplate(key: string, fallback = ""): string {
  const templates = CONTENT_TEMPLATES[key];
  if (!templates || templates.length === 0) return fallback;
  const index = Math.floor(Math.random() * templates.length);
  return templates[index].value;
}

/**
 * 取得所有已註冊的 content_key
 *
 * @returns {string[]} content_key 陣列
 */
export function getRegisteredKeys(): string[] {
  return Object.keys(CONTENT_TEMPLATES);
}

export default CONTENT_TEMPLATES;
