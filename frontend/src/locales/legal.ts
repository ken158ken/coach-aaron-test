/**
 * 法律文件內容：隱私權政策（/privacy）與服務條款（/terms）
 *
 * 純程式碼靜態內容，不走 CMS（法律文字少改且需人工審閱、版控可追溯、
 * 網址不會被誤下架而讓 Google OAuth 品牌驗證失效）。
 * zh-TW / en 同構（型別強制），由 pages/LegalPage.tsx 渲染。
 *
 * 內容依站內「實際資料流」盤點撰寫（資料表、cookie、第三方服務、cron 保存期），
 * 並對齊：個資法第 8 條告知事項與第 3 條當事人權利、Google API 服務使用者資料政策
 * （含 Limited Use 揭露）、消保法通訊交易規定。**這是依技術事實撰寫的草稿，
 * 非法律意見**；業主（2026-09-14）決定先不送律師審閱。
 *
 * 修改文字時務必同步更新 `updatedAt`。
 */

export interface LegalSection {
  /** 章節標題 */
  heading: string;
  /** 章節段落（依序顯示，在 bullets 之前） */
  paragraphs?: string[];
  /** 條列項目 */
  bullets?: string[];
  /** 條列之後的補充段落 */
  after?: string[];
}

export interface LegalDocument {
  /** 頁面主標 */
  title: string;
  /** 副標（英文小字 label） */
  label: string;
  /** 最後更新日期（ISO，顯示時依語言格式化） */
  updatedAt: string;
  /** 前言段落 */
  intro: string[];
  sections: LegalSection[];
  seo: { title: string; description: string };
}

export interface LegalDocuments {
  privacy: LegalDocument;
  terms: LegalDocument;
}

/** 站方資訊（兩份文件共用；業主 2026-09-14 提供） */
export const LEGAL_ENTITY = {
  /** 營運主體：個人經營 */
  nameZh: "阿倫教官（Coach Aaron）",
  nameEn: "Coach Aaron",
  siteUrl: "https://aaron-coach.com",
  /** 個資申訴 / 當事人權利行使窗口（教練本人） */
  privacyEmail: "s330221@gmail.com",
  /** 網站技術維護窗口（開發者） */
  technicalEmail: "ken158ken@gmail.com",
  /** 生效日 */
  effectiveDate: "2026-09-14",
} as const;

const UPDATED_AT = LEGAL_ENTITY.effectiveDate;

/* ────────────────────────────────────────────────────────────────
 * 繁體中文
 * ──────────────────────────────────────────────────────────────── */

const privacyZh: LegalDocument = {
  title: "隱私權政策",
  label: "Privacy Policy",
  updatedAt: UPDATED_AT,
  seo: {
    title: "隱私權政策",
    description:
      "阿倫教官 Coach Aaron 網站隱私權政策：說明我們蒐集哪些個人資料、蒐集目的與利用方式、Google 與 LINE 登入及 Google 日曆資料的使用、Cookie、第三方服務、保存期間與您的權利。",
  },
  intro: [
    `${LEGAL_ENTITY.nameZh}（以下簡稱「本網站」或「我們」）由阿倫教官個人經營，網址為 ${LEGAL_ENTITY.siteUrl}。我們重視您的隱私，並依據中華民國《個人資料保護法》及相關法令，制定本隱私權政策，說明我們如何蒐集、處理、利用及保護您的個人資料。`,
    "請您在使用本網站或註冊帳號前詳細閱讀本政策。當您瀏覽本網站、註冊帳號、預約課程、填寫表單或使用其他服務時，即表示您已閱讀並同意本政策的內容。",
  ],
  sections: [
    {
      heading: "一、適用範圍",
      paragraphs: [
        "本政策適用於您使用本網站（含桌機、行動裝置與安裝為應用程式的網頁版本）、會員專區、教練預約、線上課程、聊天室、客戶筆記本、意見反饋、行銷活動頁面（Landing Page）及其表單時，所涉及的個人資料蒐集、處理與利用。",
        "本網站可能包含連往第三方網站或服務的連結（例如社群平台、Podcast 平台、Google Meet 會議連結）。這些第三方有各自的隱私權政策，不適用本政策，請您自行參閱。",
      ],
    },
    {
      heading: "二、資料控管者與聯絡方式",
      paragraphs: [
        "本網站個人資料的蒐集主體為阿倫教官（個人經營）。若您對本政策有任何疑問，或欲行使本政策第十二條所列之權利，請透過下列方式與我們聯繫：",
      ],
      bullets: [
        `個人資料聯絡窗口（教練本人）：${LEGAL_ENTITY.privacyEmail}`,
        `網站技術維護窗口：${LEGAL_ENTITY.technicalEmail}`,
        "其他聯絡方式（LINE 官方帳號、社群平台）請見本網站「聯絡」頁面。",
      ],
    },
    {
      heading: "三、我們蒐集的個人資料",
      paragraphs: [
        "依您使用的功能不同，我們可能蒐集下列類別的個人資料。除法律另有規定外，您可以選擇不提供，但可能因此無法使用相關服務（詳見第十二條）。",
      ],
      bullets: [
        "帳號資料：您以電子郵件註冊時提供的電子郵件地址、顯示名稱、使用者名稱，以及經不可逆雜湊處理後儲存的密碼（我們不會保存您的明文密碼）。您可自行補充頭像、個人簡介等選填資料。",
        "第三方登入資料：您選擇以 Google 或 LINE 帳號登入時，我們會向該服務取得您的基本個人檔案，包括該平台的使用者識別碼、顯示名稱、電子郵件地址（Google 僅在其標示為已驗證時用於比對既有帳號）與頭像圖片網址，用以建立或連結您的會員帳號。",
        "預約資料：您預約教練時段時的預約時間、時長、備註、預約狀態與變更紀錄；若教練已連結 Google 日曆，預約會同步建立為日曆事件並可能產生 Google Meet 會議連結。",
        "課程與交易資料：您購買或被開通的課程、訂單編號、品項、金額、付款狀態與時間。目前本網站尚未開通線上付款，交易資料以教練人工開通紀錄為主；日後開通線上付款時，信用卡等付款工具資料將由第三方金流業者處理，本網站不會儲存完整卡號。",
        "互動內容：您在文章下的留言與評分、課程評價、與教練或其他會員的聊天訊息（含您上傳的圖片）、以及您與教練共同編輯的「客戶筆記本」內容。",
        "聯絡與報名表單：您透過聯絡表單或行銷活動頁面報名表單填寫的姓名、電話、電子郵件、LINE ID、留言內容與您所填的其他欄位。",
        "意見反饋：您透過意見反饋功能提交的文字內容與截圖。",
        "通知與在線狀態：您同意接收瀏覽器推播通知時產生的推播訂閱資訊（推播端點與加密金鑰）；您使用聊天功能時的最近上線時間，用於向對話對象顯示在線狀態。",
        "自動蒐集的技術資料：您連線時的 IP 位址、瀏覽器類型與版本、作業系統、語言設定、造訪頁面與時間，這些資料會短暫記錄於主機服務商的系統日誌，用於維運、安全防護與故障排除。",
      ],
    },
    {
      heading: "四、蒐集目的與利用方式",
      paragraphs: [
        "依《個人資料保護法》第 8 條，我們告知您下列事項：",
      ],
      bullets: [
        "蒐集目的：會員管理與身分驗證、提供與履行課程服務、教練時段預約與行事曆管理、訂單與帳務處理、客戶服務與意見回覆、會員間及會員與教練間之通訊、學習紀錄與教練筆記、系統通知、網站安全與防止濫用、法令遵循，以及經您同意之行銷活動聯繫。",
        "個人資料類別：識別類（姓名、電子郵件、電話、LINE ID、帳號識別碼）、特徵類（頭像、自我介紹）、社會情況類（課程參與、預約紀錄）、財務交易類（訂單、付款紀錄）、及您主動提供之其他內容。",
        "利用期間：自蒐集之日起至蒐集目的消失、您要求刪除或停止利用為止，並受第十條所述之保存期間限制。",
        "利用地區：中華民國境內，以及我們所使用之雲端服務商資料中心所在地（詳見第八、九條）。",
        "利用對象：本網站經營者（教練本人）、為提供服務而委託之第三方服務商（第八條）、以及依法有權要求提供之機關。",
        "利用方式：以自動化機器或其他非自動化方式進行蒐集、處理、利用及國際傳輸，且不會超出蒐集目的之必要範圍。",
      ],
      after: [
        "我們不會將您的個人資料出售、出租或以其他方式提供給第三方作為其自身行銷用途。",
      ],
    },
    {
      heading: "五、Google 使用者資料的使用",
      paragraphs: [
        "本網站使用 Google 提供的服務，並依 Google 的要求就 Google 使用者資料的使用方式向您完整說明：",
      ],
      bullets: [
        "Google 登入：您選擇以 Google 帳號登入時，我們僅要求存取您的基本個人檔案（電子郵件、姓名、頭像），用途限於建立或登入您的會員帳號。我們不會存取您的 Google 雲端硬碟、聯絡人或其他 Google 服務資料。",
        "Google 日曆（僅教練端）：教練可選擇將其 Google 日曆與本網站連結，以便會員預約時自動建立日曆事件並讀取教練的忙碌時段。為此本網站會請求「查看與編輯日曆事件」（calendar.events）與「查看日曆」（calendar.readonly）權限。此權限僅用於：(1) 讀取忙碌時段以計算可預約時間；(2) 建立、更新或取消與會員預約對應的日曆事件；(3) 由教練在後台管理其日曆活動。我們不會讀取與本網站服務無關的事件內容作其他用途。",
        "資料儲存：教練授權後產生的存取憑證（refresh token）會加密傳輸並儲存於本網站資料庫，僅供伺服器代表教練呼叫 Google Calendar API 使用。會員本身不會被要求授權 Google 日曆權限。",
        "有限使用聲明：本網站對從 Google API 取得之資訊的使用，以及向任何其他應用程式的傳輸，將遵守《Google API 服務使用者資料政策》（Google API Services User Data Policy），包括其「有限使用」（Limited Use）要求。我們不會將 Google 使用者資料用於投放廣告、出售給資料仲介，或供人工閱讀（除非取得您的明確同意、為安全目的所必要、或為遵循法律規定）。",
        "撤銷授權：教練可隨時於本網站後台「Google 日曆」頁面中斷連結，或於 Google 帳號的「安全性 → 第三方應用程式存取權」中撤銷本網站的存取權。撤銷後我們會刪除所儲存的存取憑證。",
      ],
    },
    {
      heading: "六、LINE 登入",
      paragraphs: [
        "您選擇以 LINE 帳號登入時，我們會透過 LINE Login 取得您的 LINE 使用者識別碼、顯示名稱與頭像圖片，並在您同意的情況下取得您的電子郵件地址，用途限於建立或登入您的會員帳號。我們不會存取您的 LINE 好友名單或聊天內容。您可於 LINE 應用程式的「設定 → 帳號 → 已連動的應用程式」中隨時解除連動。",
      ],
    },
    {
      heading: "七、Cookie 與瀏覽器本機儲存",
      paragraphs: ["本網站使用下列技術以維持服務運作："],
      bullets: [
        "登入 Cookie：您登入後，我們會在您的瀏覽器設置一個名為 token 的 HttpOnly 安全 Cookie，用於維持登入狀態，有效期 7 天。此 Cookie 為服務必要，無法用於跨網站追蹤。",
        "本機儲存（localStorage / sessionStorage）：用於記住您的介面偏好（深淺主題、語言）、教學導覽進度、以及尚未送出的編輯草稿，這些資料只存在您的裝置上，不會傳送給我們。",
        "Service Worker 離線快取：本網站可安裝為應用程式，並會在您的裝置快取靜態資源與圖片以加速載入，快取內容不含您的個人資料。",
        "第三方分析：本網站目前未使用 Google Analytics 或其他第三方行為分析工具，也不投放追蹤廣告。",
        "網頁字型：本網站自 Google Fonts 載入字型檔，載入時您的瀏覽器會向 Google 傳送 IP 位址等連線資訊，該傳輸受 Google 隱私權政策規範。",
      ],
      after: [
        "您可透過瀏覽器設定停用或清除 Cookie 與本機儲存，但停用登入 Cookie 將無法使用會員功能。",
      ],
    },
    {
      heading: "八、第三方服務商（受託處理者）",
      paragraphs: [
        "為提供服務，我們委託下列第三方服務商處理部分資料。這些服務商僅得依我們的指示、在提供服務所必要的範圍內處理您的資料：",
      ],
      bullets: [
        "Supabase（資料庫與檔案儲存）：儲存會員、預約、課程、訊息、筆記等資料及您上傳的圖片檔案。",
        "Vercel（網站主機與伺服器）：提供網站託管、伺服器運算與系統日誌。",
        "Cloudflare（網域名稱與網路服務）：處理網域解析與連線路由。",
        "Cloudinary（圖片託管）：部分課程與文章配圖由 Cloudinary 提供。",
        "Google（登入、日曆、會議、字型）：Google 登入、Google Calendar API、Google Meet 會議連結與 Google Fonts。",
        "LINE（登入）：LINE Login 身分驗證。",
        "Resend（電子郵件寄送）：寄送聯絡表單通知、報名通知與系統警示郵件。",
        "瀏覽器推播服務：您訂閱推播通知時，通知會透過您瀏覽器廠商（如 Google、Apple、Mozilla）提供的推播服務傳遞。",
      ],
      after: [
        "除上述受託處理者外，我們僅在下列情況揭露您的個人資料：取得您的同意；依法律、法院命令或主管機關要求；為保護本網站、其他使用者或公眾的權利、財產或安全所必要。",
      ],
    },
    {
      heading: "九、國際傳輸",
      paragraphs: [
        "我們使用的雲端服務商（如 Supabase、Vercel、Cloudinary、Google）之資料中心可能位於中華民國境外（例如美國或新加坡）。您使用本網站即表示同意您的個人資料在上述必要範圍內進行國際傳輸。我們會選擇具備適當資安措施的服務商，並以加密連線傳輸資料。",
      ],
    },
    {
      heading: "十、資料保存期間",
      paragraphs: ["我們僅在達成蒐集目的所必要的期間內保存您的個人資料："],
      bullets: [
        "帳號與個人檔案：保存至您刪除帳號或要求停止利用為止。",
        "訂單與交易紀錄：為符合稅務與會計法令要求，自交易完成起保存 5 年；期滿後刪除或去識別化。",
        "預約紀錄：保存至帳號刪除為止，作為服務履行與爭議處理之依據。",
        "聊天訊息：保存至您或對話對象刪除為止；未曾傳送任何訊息且建立超過 7 天的空白對話會由系統自動清除。",
        "客戶筆記本：由教練與會員共同編輯，保存至教練或會員刪除為止。",
        "上傳圖片與檔案：被替換或刪除的檔案先標記為軟刪除，30 天後由系統自動永久移除；未被任何內容引用的暫存檔案於 24 小時後清除。",
        "聯絡與報名表單：自最後一次聯繫起保存 2 年，以便後續諮詢與服務追蹤。",
        "推播訂閱：保存至您取消訂閱或裝置失效為止。",
        "系統日誌：由主機服務商短期保存，用於維運與安全防護。",
      ],
    },
    {
      heading: "十一、資訊安全",
      paragraphs: [
        "我們採取合理的技術與組織措施保護您的個人資料，包括：全站 HTTPS 加密傳輸；密碼以不可逆雜湊演算法儲存；登入憑證採 HttpOnly 安全 Cookie；後台管理功能限授權人員存取；使用者上傳內容經淨化處理以防止惡意程式碼；資料庫存取權限控管；以及定期的系統巡檢。",
        "然而，網際網路傳輸無法保證絕對安全。若發生個人資料外洩等安全事件，我們將依法以適當方式通知您並向主管機關通報。",
      ],
    },
    {
      heading: "十二、您的權利",
      paragraphs: [
        "依《個人資料保護法》第 3 條，您就您的個人資料享有下列權利，並可透過第二條所列聯絡方式向我們提出：",
      ],
      bullets: [
        "查詢或請求閱覽。",
        "請求製給複製本。",
        "請求補充或更正（會員可直接於會員專區修改帳號資料）。",
        "請求停止蒐集、處理或利用。",
        "請求刪除（含刪除帳號）。",
      ],
      after: [
        "我們將於收到請求後 30 日內處理並回覆。為保護您的資料安全，我們可能先請您驗證身分。依法令或契約應保存之資料（如交易紀錄）在保存期間屆滿前不予刪除，但會停止其他利用。",
        "不提供資料之影響：若您選擇不提供必要的個人資料（如註冊所需的電子郵件），我們將無法為您建立帳號或提供對應服務；若您撤回推播或行銷聯繫之同意，不影響其他服務的使用。",
      ],
    },
    {
      heading: "十三、未成年人",
      paragraphs: [
        "本網站服務以成年人為主要對象。未滿 18 歲者應在法定代理人閱讀並同意本政策後，方可註冊與使用本網站。若我們發現在未經法定代理人同意的情況下蒐集了未成年人的個人資料，將儘速刪除。",
      ],
    },
    {
      heading: "十四、政策修訂",
      paragraphs: [
        "我們可能因法令變更或服務調整而修訂本政策。修訂後的政策將公布於本頁面並更新「最後更新日期」；重大變更時，我們會於網站顯著位置或以電子郵件通知您。您於修訂後繼續使用本網站，即視為同意修訂後的內容。",
      ],
    },
    {
      heading: "十五、聯絡我們",
      paragraphs: [
        `若您對本隱私權政策有任何疑問、意見，或欲行使您的權利，請來信 ${LEGAL_ENTITY.privacyEmail}，或透過本網站「聯絡」頁面與我們聯繫。`,
      ],
    },
  ],
};

const termsZh: LegalDocument = {
  title: "服務條款",
  label: "Terms of Service",
  updatedAt: UPDATED_AT,
  seo: {
    title: "服務條款",
    description:
      "阿倫教官 Coach Aaron 網站服務條款：帳號規範、課程購買與退費原則、教練預約與取消規則、使用者內容、智慧財產權、健康免責聲明與準據法。",
  },
  intro: [
    `歡迎使用 ${LEGAL_ENTITY.nameZh} 網站（${LEGAL_ENTITY.siteUrl}，以下簡稱「本網站」）。本網站由阿倫教官個人經營。本服務條款（以下簡稱「本條款」）構成您與本網站之間具法律效力的協議，請於註冊帳號或使用服務前詳細閱讀。`,
    "當您註冊帳號、購買課程、預約時段或以任何方式使用本網站，即表示您已閱讀、瞭解並同意受本條款及《隱私權政策》之拘束。若您不同意本條款，請勿使用本網站。",
  ],
  sections: [
    {
      heading: "一、服務內容",
      paragraphs: ["本網站提供下列服務（實際內容以網站公告為準）："],
      bullets: [
        "健身、體態與心理相關的文章、影片與 Podcast 內容。",
        "線上課程與課程教材（含影音課程）。",
        "教練一對一時段預約（線上或實體）。",
        "會員與教練之間的聊天室、通知與客戶筆記本（教練與會員共同編輯的學習紀錄）。",
        "行銷活動頁面與課程諮詢報名表單。",
      ],
      after: [
        "我們得隨時新增、調整或停止部分服務內容；涉及您已付費之課程或預約時，將依第四條與第五條處理。",
      ],
    },
    {
      heading: "二、帳號註冊與管理",
      bullets: [
        "您須提供真實、正確且完整的註冊資料，並於資料變更時更新。若提供不實資料，我們得暫停或終止您的帳號。",
        "您可使用電子郵件、Google 或 LINE 帳號註冊。同一自然人以一個帳號為限。",
        "您有義務妥善保管帳號與密碼，並對以您帳號進行的一切行為負責。若發現帳號遭未經授權使用，請立即通知我們。",
        "未滿 18 歲者須經法定代理人同意後方可註冊及購買課程。",
        "您可隨時透過《隱私權政策》所列聯絡方式申請刪除帳號；帳號刪除後，依法應保存之交易紀錄仍會依規定期間保留。",
      ],
    },
    {
      heading: "三、會員行為規範",
      paragraphs: ["使用本網站時，您不得："],
      bullets: [
        "上傳或傳送違法、侵權、誹謗、騷擾、色情、暴力或其他不當內容。",
        "冒用他人身分、帳號，或提供不實資料。",
        "重製、散布、公開播送、出租或以其他方式分享課程影片、教材、文章等付費或受著作權保護之內容。",
        "將帳號借予、轉讓或出售給他人使用。",
        "以自動化程式、爬蟲或其他方式大量存取本網站，或干擾、破壞本網站的正常運作與安全。",
        "利用本網站從事任何違反法令或本條款之行為。",
      ],
      after: [
        "違反上述規範者，我們得不經通知移除相關內容、暫停或終止您的帳號，並保留法律追訴權。",
      ],
    },
    {
      heading: "四、課程購買、付款與退費",
      paragraphs: [
        "線上付款開通說明：本網站目前尚未開通線上付款功能。課程購買請透過本網站「聯絡」頁面或 LINE 官方帳號與教練確認並完成付款後，由教練為您開通課程。線上付款功能開通後，將以網站公告之付款方式與價格為準，本條款下列退費原則同樣適用。",
      ],
      bullets: [
        "價格與資訊：課程價格、內容與期限以購買當時網站顯示或教練確認之內容為準。我們得隨時調整價格，但不影響已完成之交易。",
        "猶豫期：依《消費者保護法》，您得於購買後 7 日內，就尚未開始使用之課程或服務，以書面或電子郵件通知我們解除契約並申請全額退費，無須說明理由。",
        "已開始使用之課程：若您已開始上課（含已預約並完成任一時段、或已觀看任一線上課程單元），得依實際未使用之比例申請退費；已提供之服務與已產生之必要費用（如第三方金流手續費）不予退還。",
        "數位內容例外：依《通訊交易解除權合理例外情事適用準則》，非以有形媒介提供之數位內容（如線上影音課程）一經您開始觀看即視為已提供，不適用 7 日猶豫期，但仍得依前款比例原則處理。",
        "退費方式：退費將以原付款方式退還；線上付款未開通前以教練與您約定之方式辦理。退費作業約需 7 至 14 個工作天。",
        "教練因故無法提供服務：若因教練因素導致課程無法進行，您得選擇改期或就未提供之部分全額退費。",
      ],
    },
    {
      heading: "五、教練時段預約與取消",
      bullets: [
        "預約需登入會員後於預約頁面進行，可預約時段依教練公布之時間與預約窗口為準。預約送出後須經教練確認方為成立。",
        "取消與改期：請於預約時段開始前 24 小時以上於「我的預約」取消或改期。",
        "逾時取消或未出席：於預約時段開始前 24 小時內取消、或未出席（含線上會議未上線），該時段視同已使用，恕不退還亦不補課，但教練得視個案情況酌情處理。",
        "教練取消或改期：教練因故取消或變更時段時，將盡早通知您，並提供改期或就該時段退費之選擇。",
        "線上時段：線上課程時段將提供 Google Meet 或其他會議連結，請您自行確認網路與設備正常；因您方設備或網路問題導致無法進行者，視同已使用。",
      ],
    },
    {
      heading: "六、使用者內容",
      paragraphs: [
        "您於本網站發表的留言、評分、評價、聊天訊息、上傳圖片及筆記內容（以下合稱「使用者內容」），其著作權仍歸您所有，但您同意授權本網站在提供服務所必要之範圍內（包括儲存、顯示、備份與傳輸）非專屬、免費地使用該內容。",
        "您應確保使用者內容未侵害他人權利且未違反法令。我們得在不事先通知的情況下移除違反本條款之內容。公開留言與評分會顯示於網站，請勿於其中揭露您或他人的敏感個人資料。",
      ],
    },
    {
      heading: "七、客戶筆記本",
      paragraphs: [
        "客戶筆記本是教練與購課會員共同編輯的學習紀錄，雙方皆可查看與編輯其內容。筆記本內容僅供教練與該會員使用，教練不會將其提供給其他會員。會員應理解教練於筆記本中的建議屬個人化訓練指導，並非醫療診斷。筆記本內容的保存與刪除依《隱私權政策》辦理。",
      ],
    },
    {
      heading: "八、智慧財產權",
      paragraphs: [
        "本網站的所有內容，包括但不限於課程影片、教材、文章、圖片、Logo、網站設計與程式碼，均受著作權法、商標法及其他智慧財產權法令保護，權利歸阿倫教官或其授權人所有。",
        "您購買課程所取得者，係於課程期限內以個人非商業目的觀看與使用之授權，並非內容之所有權。未經書面同意，您不得重製、公開傳輸、改作、散布、出租或以任何方式將本網站內容提供給第三人，亦不得移除內容上的權利標示。",
      ],
    },
    {
      heading: "九、健康聲明與免責",
      bullets: [
        "本網站提供的健身、飲食與心理相關內容及教練指導，僅供一般資訊與訓練參考，不構成醫療診斷、治療或專業醫療建議，亦不能取代醫師或其他醫療專業人員的意見。",
        "開始任何運動或飲食計畫前，請先評估自身健康狀況；若您有心血管疾病、關節傷害、懷孕或其他特殊健康情形，請先諮詢醫師。",
        "您瞭解運動本身具有受傷風險，並同意在自身能力範圍內進行訓練。對於您因自行判斷、未依指導或隱瞞健康狀況而導致的傷害，本網站在法律允許的範圍內不負賠償責任。",
        "訓練成效因人而異，本網站不保證任何特定的體態、體重或成績結果。",
      ],
    },
    {
      heading: "十、服務變更、中斷與終止",
      paragraphs: [
        "我們會盡力維持服務穩定，但因系統維護、升級、第三方服務商故障、不可抗力或其他非可歸責於我們之事由，服務可能暫時中斷或變更，我們將於可能範圍內事先公告。",
        "若您違反本條款，我們得暫停或終止您的帳號與服務。若我們決定永久停止本網站服務，將提前 30 日公告，並就您已付費但尚未提供之課程依第四條辦理退費。",
      ],
    },
    {
      heading: "十一、責任限制",
      paragraphs: [
        "在法律允許的最大範圍內，本網站對於因使用或無法使用本服務所生的任何間接、附隨、衍生性損害（包括利潤損失、資料遺失）不負賠償責任；就任何請求，我們對您的賠償責任總額以您於該請求發生前 12 個月內實際支付予本網站之金額為上限。上述限制不適用於因我們故意或重大過失所致之損害，亦不影響您依《消費者保護法》所享有之權利。",
      ],
    },
    {
      heading: "十二、隱私",
      paragraphs: [
        "我們如何蒐集、處理與利用您的個人資料，請參閱《隱私權政策》。該政策為本條款之一部分。",
      ],
    },
    {
      heading: "十三、準據法與管轄",
      paragraphs: [
        "本條款之解釋與適用以中華民國法律為準據法。因本條款所生之爭議，雙方同意先以誠信協商解決；協商不成時，以臺灣臺北地方法院為第一審管轄法院，但不影響您依《消費者保護法》等法令所得主張之管轄權益。",
      ],
    },
    {
      heading: "十四、條款修訂與其他",
      paragraphs: [
        "我們得隨時修訂本條款，修訂後將公布於本頁面並更新「最後更新日期」；重大變更時將於網站顯著位置或以電子郵件通知。您於修訂後繼續使用本網站即視為同意修訂內容。",
        "本條款任一部分經認定無效時，不影響其餘部分之效力。本條款以繁體中文版本為準，英文版本僅供參考。",
        `若您對本條款有任何疑問，請來信 ${LEGAL_ENTITY.privacyEmail} 或透過本網站「聯絡」頁面與我們聯繫。`,
      ],
    },
  ],
};

/* ────────────────────────────────────────────────────────────────
 * English
 * ──────────────────────────────────────────────────────────────── */

const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  label: "Privacy Policy",
  updatedAt: UPDATED_AT,
  seo: {
    title: "Privacy Policy",
    description:
      "Coach Aaron privacy policy: what personal data we collect, why and how we use it, how Google and LINE sign-in and Google Calendar data are handled, cookies, third-party services, retention periods and your rights.",
  },
  intro: [
    `${LEGAL_ENTITY.nameEn} (the "Site", "we", "us") at ${LEGAL_ENTITY.siteUrl} is operated by Coach Aaron as an individual. We value your privacy. This Privacy Policy, prepared in accordance with the Personal Data Protection Act of Taiwan (R.O.C.) and related regulations, explains how we collect, process, use and protect your personal data.`,
    "Please read this Policy carefully before using the Site or creating an account. By browsing the Site, registering, booking sessions, submitting forms or using any other service, you acknowledge that you have read and agree to this Policy.",
  ],
  sections: [
    {
      heading: "1. Scope",
      paragraphs: [
        "This Policy applies to personal data collected, processed and used when you use the Site (on desktop, mobile, or installed as a web app), the member area, coach bookings, online courses, chat, client notebooks, feedback, marketing landing pages and their forms.",
        "The Site may link to third-party websites or services (for example social platforms, podcast platforms or Google Meet links). Those third parties have their own privacy policies, which are not covered by this Policy.",
      ],
    },
    {
      heading: "2. Data Controller and Contact",
      paragraphs: [
        "Personal data on the Site is collected by Coach Aaron (individual operator). If you have any questions about this Policy or wish to exercise the rights described in Section 12, please contact us at:",
      ],
      bullets: [
        `Personal data contact (the coach): ${LEGAL_ENTITY.privacyEmail}`,
        `Technical maintenance contact: ${LEGAL_ENTITY.technicalEmail}`,
        "Other channels (LINE official account, social platforms) are listed on the Contact page.",
      ],
    },
    {
      heading: "3. Personal Data We Collect",
      paragraphs: [
        "Depending on the features you use, we may collect the following categories of personal data. Unless required by law, you may choose not to provide data, but some services may then be unavailable (see Section 12).",
      ],
      bullets: [
        "Account data: the email address, display name and username you provide when registering with email, and your password stored only as an irreversible hash (we never store plain-text passwords). You may optionally add an avatar and profile bio.",
        "Third-party sign-in data: when you sign in with Google or LINE, we receive your basic profile from that provider, including the provider user ID, display name, email address (for Google, used to match an existing account only when Google marks it as verified) and avatar image URL, in order to create or link your member account.",
        "Booking data: the time, duration, notes, status and change history of sessions you book. If the coach has connected Google Calendar, bookings are synchronised as calendar events and may generate a Google Meet link.",
        "Course and transaction data: courses you purchase or are granted, order numbers, items, amounts, payment status and timestamps. Online payment is not yet enabled on the Site; transaction records currently reflect manual activation by the coach. When online payment is enabled, card details will be processed by a third-party payment provider and the Site will never store full card numbers.",
        "Interaction content: your comments and ratings on articles, course reviews, chat messages with the coach or other members (including images you upload), and the content of the client notebook you co-edit with the coach.",
        "Contact and sign-up forms: the name, phone number, email, LINE ID, message and any other fields you submit through the contact form or landing-page sign-up forms.",
        "Feedback: text and screenshots you submit through the feedback feature.",
        "Notifications and presence: push subscription details (endpoint and encryption keys) when you opt in to browser push notifications; and your last-active time when using chat, shown to conversation participants as an online indicator.",
        "Automatically collected technical data: your IP address, browser type and version, operating system, language setting, pages visited and timestamps, recorded briefly in our hosting provider's system logs for operations, security and troubleshooting.",
      ],
    },
    {
      heading: "4. Purposes and Use",
      paragraphs: [
        "Pursuant to Article 8 of the Personal Data Protection Act, we inform you of the following:",
      ],
      bullets: [
        "Purposes: member management and authentication; delivering course services; coach booking and calendar management; order and billing processing; customer service and feedback; communication between members and with the coach; learning records and coaching notes; system notifications; site security and abuse prevention; legal compliance; and marketing contact where you have consented.",
        "Categories: identifiers (name, email, phone, LINE ID, account IDs), characteristics (avatar, bio), social circumstances (course participation, bookings), financial transactions (orders, payments), and any other content you voluntarily provide.",
        "Period: from collection until the purpose no longer exists or you request deletion or cessation, subject to the retention periods in Section 10.",
        "Territory: Taiwan (R.O.C.) and the locations of the data centres of the cloud providers we use (see Sections 8 and 9).",
        "Recipients: the Site operator (the coach), third-party processors engaged to provide the service (Section 8), and authorities entitled by law to request data.",
        "Methods: automated and non-automated collection, processing, use and international transfer, never beyond what is necessary for the stated purposes.",
      ],
      after: [
        "We do not sell, rent or otherwise provide your personal data to third parties for their own marketing purposes.",
      ],
    },
    {
      heading: "5. Use of Google User Data",
      paragraphs: [
        "The Site uses services provided by Google. As required by Google, we fully disclose how Google user data is used:",
      ],
      bullets: [
        "Google Sign-In: when you sign in with Google we request only your basic profile (email, name, avatar), used solely to create or sign in to your member account. We do not access your Google Drive, Contacts or any other Google service data.",
        "Google Calendar (coach only): the coach may connect their Google Calendar to the Site so that member bookings automatically create calendar events and the coach's busy times can be read. For this the Site requests the \"view and edit events on your calendars\" (calendar.events) and \"see your calendars\" (calendar.readonly) permissions. These are used only to: (1) read busy periods to compute available booking slots; (2) create, update or cancel calendar events corresponding to member bookings; and (3) let the coach manage their calendar events in the admin area. We do not read events unrelated to the Site's services for any other purpose.",
        "Storage: the access credential (refresh token) generated when the coach authorises access is transmitted over encrypted connections and stored in the Site database, used only by our server to call the Google Calendar API on the coach's behalf. Members are never asked to grant calendar permissions.",
        "Limited Use disclosure: Coach Aaron's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements. We do not use Google user data for advertising, sell it to data brokers, or allow humans to read it except with your explicit consent, for security purposes, or to comply with applicable law.",
        "Revoking access: the coach may disconnect at any time from the Google Calendar page in the admin area, or revoke the Site's access under Google Account → Security → Third-party apps. Upon revocation we delete the stored credential.",
      ],
    },
    {
      heading: "6. LINE Login",
      paragraphs: [
        "When you sign in with LINE, we obtain your LINE user ID, display name and profile picture through LINE Login, and your email address where you consent, solely to create or sign in to your member account. We do not access your LINE friends list or chat content. You may unlink at any time under LINE → Settings → Account → Linked apps.",
      ],
    },
    {
      heading: "7. Cookies and Local Storage",
      paragraphs: ["The Site uses the following technologies to operate:"],
      bullets: [
        "Login cookie: after signing in, we set an HttpOnly secure cookie named token in your browser to keep you signed in for 7 days. It is strictly necessary and cannot be used for cross-site tracking.",
        "Local storage (localStorage / sessionStorage): remembers your interface preferences (light/dark theme, language), onboarding tour progress and unsent editor drafts. This data stays on your device and is not sent to us.",
        "Service Worker offline cache: the Site can be installed as an app and caches static assets and images on your device for faster loading. Cached content contains no personal data.",
        "Third-party analytics: the Site currently uses no Google Analytics or other third-party behavioural analytics and serves no tracking ads.",
        "Web fonts: fonts are loaded from Google Fonts; when loading, your browser sends connection information such as your IP address to Google, governed by Google's privacy policy.",
      ],
      after: [
        "You may disable or clear cookies and local storage in your browser settings, but disabling the login cookie will prevent use of member features.",
      ],
    },
    {
      heading: "8. Third-Party Service Providers (Processors)",
      paragraphs: [
        "To provide the service we engage the following providers, who may process your data only on our instructions and to the extent necessary:",
      ],
      bullets: [
        "Supabase (database and file storage): stores member, booking, course, message and notebook data and images you upload.",
        "Vercel (hosting and servers): provides web hosting, server compute and system logs.",
        "Cloudflare (domain and network): handles DNS resolution and connection routing.",
        "Cloudinary (image hosting): serves some course and article images.",
        "Google (sign-in, calendar, meetings, fonts): Google Sign-In, Google Calendar API, Google Meet links and Google Fonts.",
        "LINE (sign-in): LINE Login authentication.",
        "Resend (email delivery): sends contact-form notifications, sign-up notifications and system alerts.",
        "Browser push services: when you subscribe to push notifications, they are delivered through the push service of your browser vendor (such as Google, Apple or Mozilla).",
      ],
      after: [
        "Beyond these processors, we disclose personal data only: with your consent; when required by law, court order or a competent authority; or when necessary to protect the rights, property or safety of the Site, other users or the public.",
      ],
    },
    {
      heading: "9. International Transfers",
      paragraphs: [
        "The data centres of the cloud providers we use (such as Supabase, Vercel, Cloudinary and Google) may be located outside Taiwan, for example in the United States or Singapore. By using the Site you consent to the international transfer of your personal data to the extent necessary. We choose providers with appropriate security measures and transmit data over encrypted connections.",
      ],
    },
    {
      heading: "10. Retention Periods",
      paragraphs: ["We retain personal data only as long as necessary for the purposes collected:"],
      bullets: [
        "Account and profile: until you delete your account or request cessation of use.",
        "Orders and transaction records: 5 years from completion of the transaction to satisfy tax and accounting requirements, then deleted or anonymised.",
        "Booking records: until account deletion, as a basis for service delivery and dispute resolution.",
        "Chat messages: until you or the other participant deletes them; empty conversations with no messages older than 7 days are automatically removed.",
        "Client notebooks: co-edited by the coach and member, retained until either deletes them.",
        "Uploaded images and files: replaced or deleted files are soft-deleted first and permanently removed automatically after 30 days; temporary files not referenced by any content are removed after 24 hours.",
        "Contact and sign-up forms: 2 years from the last contact, for follow-up consultation and service tracking.",
        "Push subscriptions: until you unsubscribe or the device becomes invalid.",
        "System logs: retained briefly by the hosting provider for operations and security.",
      ],
    },
    {
      heading: "11. Security",
      paragraphs: [
        "We take reasonable technical and organisational measures to protect your personal data, including site-wide HTTPS encryption, irreversible password hashing, HttpOnly secure login cookies, admin features restricted to authorised personnel, sanitisation of user-uploaded content against malicious code, database access controls and regular system health checks.",
        "No transmission over the internet can be guaranteed absolutely secure. In the event of a personal data breach we will notify you by appropriate means and report to the competent authority as required by law.",
      ],
    },
    {
      heading: "12. Your Rights",
      paragraphs: [
        "Under Article 3 of the Personal Data Protection Act you have the following rights regarding your personal data, which you may exercise through the contact channels in Section 2:",
      ],
      bullets: [
        "To inquire about or request access to your data.",
        "To request a copy.",
        "To request supplementation or correction (members may edit account data directly in the member area).",
        "To request cessation of collection, processing or use.",
        "To request deletion (including account deletion).",
      ],
      after: [
        "We will process and respond within 30 days of receiving a request. To protect your data we may first ask you to verify your identity. Data that must be retained by law or contract (such as transaction records) will not be deleted before its retention period ends, but other uses will cease.",
        "Consequences of not providing data: if you choose not to provide necessary personal data (such as the email required for registration), we cannot create an account or provide the corresponding service. Withdrawing consent to push or marketing contact does not affect other services.",
      ],
    },
    {
      heading: "13. Minors",
      paragraphs: [
        "The Site is intended primarily for adults. Persons under 18 may register and use the Site only after their legal guardian has read and agreed to this Policy. If we learn that we have collected a minor's personal data without guardian consent, we will delete it promptly.",
      ],
    },
    {
      heading: "14. Changes to This Policy",
      paragraphs: [
        "We may revise this Policy due to legal changes or service adjustments. The revised Policy will be posted on this page with an updated \"last updated\" date; for material changes we will notify you prominently on the Site or by email. Continued use of the Site after a revision constitutes acceptance of the revised Policy.",
      ],
    },
    {
      heading: "15. Contact Us",
      paragraphs: [
        `If you have questions or comments about this Privacy Policy, or wish to exercise your rights, please email ${LEGAL_ENTITY.privacyEmail} or reach us through the Contact page.`,
      ],
    },
  ],
};

const termsEn: LegalDocument = {
  title: "Terms of Service",
  label: "Terms of Service",
  updatedAt: UPDATED_AT,
  seo: {
    title: "Terms of Service",
    description:
      "Coach Aaron terms of service: account rules, course purchase and refund principles, coaching session booking and cancellation, user content, intellectual property, health disclaimer and governing law.",
  },
  intro: [
    `Welcome to the ${LEGAL_ENTITY.nameEn} website (${LEGAL_ENTITY.siteUrl}, the "Site"), operated by Coach Aaron as an individual. These Terms of Service ("Terms") form a legally binding agreement between you and the Site. Please read them carefully before registering or using the service.`,
    "By registering an account, purchasing a course, booking a session or otherwise using the Site, you acknowledge that you have read, understood and agree to be bound by these Terms and the Privacy Policy. If you do not agree, please do not use the Site.",
  ],
  sections: [
    {
      heading: "1. Services",
      paragraphs: ["The Site provides the following services (subject to what is published on the Site):"],
      bullets: [
        "Articles, videos and podcast content on fitness, body composition and mindset.",
        "Online courses and course materials (including video lessons).",
        "One-on-one coaching session bookings (online or in person).",
        "Chat between members and the coach, notifications, and client notebooks (learning records co-edited by the coach and member).",
        "Marketing landing pages and course enquiry sign-up forms.",
      ],
      after: [
        "We may add, adjust or discontinue parts of the service at any time; where paid courses or bookings are affected, Sections 4 and 5 apply.",
      ],
    },
    {
      heading: "2. Accounts",
      bullets: [
        "You must provide true, accurate and complete registration information and keep it updated. We may suspend or terminate accounts registered with false information.",
        "You may register with email, Google or LINE. One account per natural person.",
        "You are responsible for safeguarding your credentials and for all activity under your account. Notify us immediately of any unauthorised use.",
        "Persons under 18 may register and purchase courses only with the consent of a legal guardian.",
        "You may request account deletion at any time through the contacts listed in the Privacy Policy; transaction records required by law will still be retained for the statutory period.",
      ],
    },
    {
      heading: "3. Acceptable Use",
      paragraphs: ["When using the Site you must not:"],
      bullets: [
        "Upload or transmit unlawful, infringing, defamatory, harassing, pornographic, violent or otherwise inappropriate content.",
        "Impersonate any person or account, or provide false information.",
        "Copy, distribute, publicly transmit, rent or otherwise share course videos, materials, articles or other paid or copyrighted content.",
        "Lend, transfer or sell your account to others.",
        "Access the Site in bulk through automated scripts or crawlers, or interfere with or disrupt the Site's operation or security.",
        "Use the Site for any activity that violates the law or these Terms.",
      ],
      after: [
        "We may remove content, suspend or terminate accounts without prior notice for violations, and reserve the right to pursue legal remedies.",
      ],
    },
    {
      heading: "4. Purchases, Payment and Refunds",
      paragraphs: [
        "Online payment status: online payment is not yet enabled on the Site. To purchase a course, please confirm and complete payment with the coach through the Contact page or the LINE official account, after which the coach will activate the course for you. Once online payment is enabled, the payment methods and prices published on the Site will apply, and the refund principles below apply equally.",
      ],
      bullets: [
        "Prices and information: course prices, content and validity are as shown on the Site or confirmed by the coach at the time of purchase. We may adjust prices at any time without affecting completed transactions.",
        "Cooling-off period: under the Consumer Protection Act, you may rescind the contract and request a full refund within 7 days of purchase for courses or services you have not started, by written notice or email, without giving reasons.",
        "Courses already started: if you have started (including completing any booked session or viewing any online lesson), you may request a pro-rata refund for the unused portion; services already delivered and necessary costs incurred (such as third-party payment fees) are non-refundable.",
        "Digital content exception: under the Guidelines on Reasonable Exceptions to the Right of Rescission in Distance Transactions, digital content not supplied on a tangible medium (such as online video courses) is deemed delivered once you begin viewing and is not subject to the 7-day cooling-off period, but the pro-rata principle above still applies.",
        "Refund method: refunds are returned via the original payment method; before online payment is enabled, refunds are handled as agreed between you and the coach. Processing takes approximately 7 to 14 business days.",
        "Coach unable to deliver: if a course cannot proceed for reasons attributable to the coach, you may choose to reschedule or receive a full refund for the undelivered portion.",
      ],
    },
    {
      heading: "5. Session Booking and Cancellation",
      bullets: [
        "Bookings are made on the booking page after signing in, within the times and booking window published by the coach. A booking is confirmed only after the coach accepts it.",
        "Cancellation and rescheduling: please cancel or reschedule under \"My Bookings\" at least 24 hours before the session starts.",
        "Late cancellation or no-show: cancellations within 24 hours of the start time, or failure to attend (including not joining an online meeting), are treated as used; no refund or make-up session is provided, though the coach may make exceptions case by case.",
        "Coach cancellation: if the coach must cancel or change a session, we will notify you as early as possible and offer rescheduling or a refund for that session.",
        "Online sessions: a Google Meet or similar link will be provided. Please ensure your network and equipment are working; sessions that cannot proceed due to issues on your side are treated as used.",
      ],
    },
    {
      heading: "6. User Content",
      paragraphs: [
        "You retain copyright in comments, ratings, reviews, chat messages, uploaded images and notebook content you post on the Site (\"User Content\"), but grant the Site a non-exclusive, royalty-free licence to use it to the extent necessary to provide the service (including storage, display, backup and transmission).",
        "You must ensure User Content does not infringe others' rights or violate the law. We may remove content that violates these Terms without prior notice. Public comments and ratings are displayed on the Site; do not disclose sensitive personal data about yourself or others in them.",
      ],
    },
    {
      heading: "7. Client Notebooks",
      paragraphs: [
        "A client notebook is a learning record co-edited by the coach and a member who has purchased a course; both may view and edit it. Notebook content is for the coach and that member only and is not shared with other members. Members understand that the coach's notes are personalised training guidance, not medical diagnosis. Retention and deletion follow the Privacy Policy.",
      ],
    },
    {
      heading: "8. Intellectual Property",
      paragraphs: [
        "All content on the Site, including course videos, materials, articles, images, logos, site design and code, is protected by copyright, trademark and other intellectual property laws and belongs to Coach Aaron or its licensors.",
        "Purchasing a course grants you a licence to view and use the content for personal, non-commercial purposes during the course period; it does not transfer ownership. Without written consent you may not reproduce, publicly transmit, adapt, distribute, rent or otherwise provide Site content to third parties, nor remove any rights notices.",
      ],
    },
    {
      heading: "9. Health Notice and Disclaimer",
      bullets: [
        "The fitness, nutrition and mindset content and coaching on the Site are general information and training guidance only. They do not constitute medical diagnosis, treatment or professional medical advice and do not replace the advice of a physician or other healthcare professional.",
        "Assess your health before starting any exercise or nutrition programme. If you have cardiovascular disease, joint injuries, are pregnant or have other special health conditions, consult a physician first.",
        "You understand that exercise carries a risk of injury and agree to train within your own abilities. To the extent permitted by law, the Site is not liable for injuries resulting from your own judgement, failure to follow guidance, or undisclosed health conditions.",
        "Results vary between individuals. The Site does not guarantee any specific physique, weight or performance outcome.",
      ],
    },
    {
      heading: "10. Changes, Interruption and Termination",
      paragraphs: [
        "We strive to keep the service stable, but it may be temporarily interrupted or changed due to maintenance, upgrades, third-party provider outages, force majeure or other causes not attributable to us. We will announce in advance where possible.",
        "If you violate these Terms we may suspend or terminate your account and service. If we decide to permanently discontinue the Site, we will announce it 30 days in advance and refund paid but undelivered courses under Section 4.",
      ],
    },
    {
      heading: "11. Limitation of Liability",
      paragraphs: [
        "To the maximum extent permitted by law, the Site is not liable for any indirect, incidental or consequential damages (including lost profits or data loss) arising from use of or inability to use the service; our total liability for any claim is limited to the amount you actually paid to the Site in the 12 months preceding the claim. These limits do not apply to damage caused by our wilful misconduct or gross negligence, nor do they affect your rights under the Consumer Protection Act.",
      ],
    },
    {
      heading: "12. Privacy",
      paragraphs: [
        "How we collect, process and use your personal data is described in the Privacy Policy, which forms part of these Terms.",
      ],
    },
    {
      heading: "13. Governing Law and Jurisdiction",
      paragraphs: [
        "These Terms are governed by the laws of Taiwan (R.O.C.). Disputes arising from these Terms shall first be resolved through good-faith negotiation; failing that, the Taiwan Taipei District Court shall be the court of first instance, without prejudice to any jurisdiction rights you have under the Consumer Protection Act or other laws.",
      ],
    },
    {
      heading: "14. Changes and Miscellaneous",
      paragraphs: [
        "We may revise these Terms at any time. Revisions will be posted on this page with an updated \"last updated\" date; material changes will be announced prominently on the Site or by email. Continued use after a revision constitutes acceptance.",
        "If any part of these Terms is held invalid, the remainder remains in effect. The Traditional Chinese version prevails; the English version is provided for reference only.",
        `If you have questions about these Terms, please email ${LEGAL_ENTITY.privacyEmail} or contact us through the Contact page.`,
      ],
    },
  ],
};

export const legalDocs: Record<"zh-TW" | "en", LegalDocuments> = {
  "zh-TW": { privacy: privacyZh, terms: termsZh },
  en: { privacy: privacyEn, terms: termsEn },
};
