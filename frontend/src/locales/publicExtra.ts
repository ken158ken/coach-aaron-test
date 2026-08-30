/**
 * 公開站補充翻譯（首頁 sections、公開頁面）
 * @module locales/publicExtra
 *
 * ⚠️ 分檔規則：這個檔案只放「公開站」新增的翻譯 namespace，
 * 會員區放 memberExtra.ts、後台放 adminExtra.ts —— 三檔各自獨立、
 * 由 LanguageContext 統一 spread 合併，避免多人同改一個大字典檔。
 *
 * ⚠️ 合併方式是「頂層 shallow spread」，所以這裡的 namespace 必須是全新的頂層 key，
 * 不能與核心字典的 nav / common / theme / article / course / videos / contact /
 * member / login / register / checkout / admin / exportFeature 同名（同名會整段覆蓋）。
 *
 * namespace 一覽：
 *   版面     layoutExtra
 *   首頁區塊 heroSection, coachIntro, servicesSection, careerCarousel,
 *            testimonials, certifications, podcast, gallery, homePopup
 *   公開頁   aboutPage, appInstall, homeSeo, contactExtra, authExtra,
 *            coursesExtra, courseDetailExtra, videosExtra, lessonsPage,
 *            lessonDetail, articlesExtra, articleDetailExtra
 *
 * 註：DB 內容（course_title / article_content / popup_title…）不放這裡，
 *     一律由 hooks/useLocalize.ts 的 loc() 依語言讀 *_en 欄位並 fallback 中文。
 */

/** 公開站補充翻譯的形狀（zh 與 en 必須同構） */
export interface PublicExtraTranslations {
  /** 版面共用（Navbar / Footer）文字 */
  layoutExtra: {
    brandName: string;
    brandTagline: string;
    rightsReserved: string;
    logoHomeAria: string;
    userMenuAria: string;
    menuAria: string;
    switchToLight: string;
    switchToDark: string;
    bookConsult: string;
    myBookings: string;
    messages: string;
    coachDashboard: string;
    loginRegister: string;
    feedback: string;
  };
  /**
   * 教練公開資訊的文字部分。
   * constants/app.ts 的 COACH_INFO 仍是 EMAIL / LINE_ID 等非文字資料的來源，
   * 但 NAME / TITLE / BUSINESS_HOURS 是會隨語言變的文案，改由字典提供。
   */
  coachInfo: {
    name: string;
    title: string;
    businessHours: string;
  };
  /** components/auth/SocialLoginButtons 的無障礙標籤 */
  authUi: {
    googleAria: string;
    lineAria: string;
  };

  // ── frag-sections.ts ──
  heroSection: {
    /** 主標，`\n` 換行；第一行最後一個詞會被 flipWords 輪播替換 */
    title: string;
    subtitle: string;
    flipWords: string[];
    ctaPrimary: string;
    ctaSecondary: string;
  };
  coachIntro: {
    tagline: string;
    name: string;
    title: string;
    about: string;
    bullets: string[];
    cta: string;
  };
  servicesSection: {
    tagline: string;
    title: string;
    subtitle: string;
    /** 課程未填分類時的預設卡片分類標籤 */
    defaultCategory: string;
    /** 無課程時的空狀態 */
    empty: string;
  };
  careerCarousel: {
    tagline: string;
    title: string;
    subtitle: string;
    clickHint: string;
    experiences: {
      realtor: {
        period: string;
        role: string;
        org: string;
        summary: string;
        bullets: string[];
      };
      personalTrainer: {
        period: string;
        role: string;
        org: string;
        summary: string;
        bullets: string[];
      };
      headCoach: {
        period: string;
        role: string;
        org: string;
        summary: string;
        bullets: string[];
        highlightValue: string;
        highlightLabel: string;
      };
    };
  };
  testimonials: {
    tagline: string;
    title: string;
    subtitle: string;
    /** 頭像 alt（無姓名時） */
    avatarAlt: string;
    /** 見證圖片 alt（無姓名時） */
    slideAlt: string;
    prev: string;
    next: string;
    /** `第 {n} 組` */
    groupLabel: string;
    /** `第 {n} 張` */
    slideLabel: string;
  };
  certifications: {
    tagline: string;
    title: string;
    certs: {
      nsca: { label: string; sub: string };
      tquk: { label: string; sub: string };
      nlp: { label: string; sub: string };
      andaction: { label: string; sub: string };
      fitnessC: { label: string; sub: string };
      ace: { label: string; sub: string };
      issa: { label: string; sub: string };
    };
    stats: {
      team: { label: string; sub: string };
      hours: { label: string; sub: string };
      years: { label: string; sub: string };
      episodes: { label: string; sub: string };
      coaches: { label: string; sub: string };
      income: { label: string; sub: string };
    };
  };
  podcast: {
    tagline: string;
    title: string;
    subtitle: string;
    playEpisode: string;
    close: string;
    categories: {
      training: string;
      nutrition: string;
      mindset: string;
    };
    episodes: {
      ep1: { title: string; description: string; fullDescription: string };
      ep2: { title: string; description: string; fullDescription: string };
      ep3: { title: string; description: string; fullDescription: string };
    };
  };
  gallery: {
    tagline: string;
    title: string;
    subtitle: string;
    /** `相片 {n}` — 圖片 alt / 無說明時的替代文字 */
    photoAlt: string;
    prev: string;
    next: string;
    /** `第 {n} 張` */
    slideLabel: string;
    moments: {
      tagline: string;
      title: string;
      subtitle: string;
    };
  };
  homePopup: {
    close: string;
    /** 品牌 LogoMark 的 title 屬性 */
    logoTitle: string;
    cta: string;
  };

  // ── frag-pages-a.ts ──
  /** 關於頁（About.tsx）— 靜態內容全部搬進字典，頁面只留版型與圖片 */
  aboutPage: {
    seo: {
      title: string;
      description: string;
      keywords: string[];
      author: string;
      breadcrumb: string;
    };
    hero: {
      title: string;
      subtitle: string;
      leadBefore: string;
      leadHighlight: string;
    };
    timeline: {
      heading: string;
      /** 依時間正序，長度需與 About.tsx 的 TIMELINE_MEDIA 一致 */
      items: {
        period: string;
        role: string;
        org: string;
        summary: string;
        points: string[];
        imageAlt: string;
      }[];
    };
    certifications: {
      heading: string;
      items: string[];
    };
    stats: {
      heading: string;
      items: { value: string; label: string }[];
    };
    story: {
      heading: string;
      p1Before: string;
      p1Highlight: string;
      p1After: string;
      p2: string;
      p3Before: string;
      p3Highlight: string;
      p3After: string;
    };
    cta: {
      title: string;
      subtitle: string;
      primary: string;
      secondary: string;
    };
  };
  /** 「變成 APP」安裝教學頁（AppInstall.tsx） */
  appInstall: {
    seo: {
      title: string;
      description: string;
      breadcrumb: string;
    };
    header: {
      title: string;
      subtitle: string;
    };
    /** 手機示意圖裡的 APP 名稱 */
    phoneIconLabel: string;
    afterInstallNote: string;
    installedMsg: string;
    installBtn: string;
    ios: {
      heading: string;
      /** 長度固定 4，對應 4 個步驟卡 */
      steps: { title: string; desc: string }[];
    };
    android: {
      heading: string;
      steps: { title: string; desc: string }[];
    };
    footnote: string;
  };
  /** 首頁 SEO（Home.tsx 只有 SEOHead 有文案） */
  homeSeo: {
    title: string;
    description: string;
    keywords: string[];
    author: string;
  };
  /** Contact.tsx 既有 `contact` namespace 未涵蓋的部分 */
  contactExtra: {
    seoKeywords: string[];
    /** 教練資訊橫幅上的證照小標籤 */
    badges: {
      nsca: string;
      tquk: string;
      nlp: string;
      coachesTrained: string;
    };
    /** 社群連結卡片的名稱與副標 */
    social: {
      lineOfficialName: string;
      lineGroupName: string;
      lineGroupDesc: string;
      facebookDesc: string;
      podcastDesc: string;
      notionDesc: string;
    };
    hoverHint: string;
    sending: string;
    validation: {
      nameMin: string;
      nameMax: string;
      emailInvalid: string;
      phoneInvalid: string;
      subjectRequired: string;
      subjectMax: string;
      messageMin: string;
      messageMax: string;
    };
    errors: {
      sendFailed: string;
      sendFailedRetry: string;
    };
  };
  /** Login.tsx / Register.tsx 既有 `login`、`register` namespace 未涵蓋的部分 */
  authExtra: {
    /** 品牌直式 lockup 的無障礙標題（<title> in SVG） */
    brandLogoTitle: string;
    login: {
      seoTitle: string;
      sessionExpired: string;
      loginFailed: string;
      oauth: {
        verifyFailed: string;
        denied: string;
        noCode: string;
        invalidProfile: string;
        createFailed: string;
        serverError: string;
        generic: string;
      };
    };
    register: {
      seoTitle: string;
    };
  };

  // ── frag-pages-b.ts ──
  coursesExtra: {
    /** PageHeader 副標 */
    subtitle: string;
    /** SEOHead description */
    seoDescription: string;
    /** SEOHead keywords */
    seoKeywords: string[];
  };
  courseDetailExtra: {
    /** 找不到課程 */
    notFound: string;
    /** 評價輸入框 placeholder */
    reviewPlaceholder: string;
    /** 課程沒有自訂關鍵字時的 SEO fallback */
    fallbackKeywords: string[];
  };
  videosExtra: {
    seoDescription: string;
    seoKeywords: string[];
    /** 總數列，{count} 會被替換成數字 */
    totalCount: string;
    /** 無限捲動載入中 */
    loadingMore: string;
    /** 回到頂部按鈕 aria-label / title */
    backToTop: string;
  };
  lessonsPage: {
    /** 頁面標題 + 麵包屑名稱（LessonDetail 也共用） */
    title: string;
    /** PageHeader 副標 */
    subtitle: string;
    seoDescription: string;
    seoKeywords: string[];
    /** 空狀態 */
    noLessons: string;
  };
  lessonDetail: {
    /** JSON-LD author */
    author: string;
    /** 影片不存在 */
    notFound: string;
    /** 返回教學影片列表 */
    backToLessons: string;
    /** 逐字稿面板標題 */
    transcript: string;
    /** 逐字稿句數單位 */
    lines: string;
    /** 尚無逐字稿 */
    noTranscript: string;
    /** 手機版逐字稿位置提示 */
    transcriptHint: string;
    /** 點句子跳轉提示 */
    seekHint: string;
    /** 影片沒有關鍵字時的 SEO fallback */
    fallbackKeywords: string[];
  };
  articlesExtra: {
    subtitle: string;
    seoDescription: string;
    seoKeywords: string[];
    /** 載入文章失敗 */
    loadFailed: string;
  };
  articleDetailExtra: {
    /** 找不到文章 */
    notFound: string;
    /** 載入文章失敗 */
    loadFailed: string;
    /** 留言者沒有暱稱時的預設稱呼 */
    defaultUser: string;
  };
}

export const publicExtra: {
  zhTW: PublicExtraTranslations;
  en: PublicExtraTranslations;
} = {
  zhTW: {
  layoutExtra: {
    brandName: "阿倫教官",
    brandTagline: "心理學 × 健身講師",
    rightsReserved: "All rights reserved",
    logoHomeAria: "阿倫教官 Coach Aaron 首頁",
    userMenuAria: "使用者選單",
    menuAria: "選單",
    switchToLight: "切換亮色模式",
    switchToDark: "切換深色模式",
    bookConsult: "預約諮詢",
    myBookings: "我的預約",
    messages: "訊息",
    coachDashboard: "教練儀表板",
    loginRegister: "登入 / 註冊",
    feedback: "意見反饋",
  },
  coachInfo: {
    name: "阿倫教官",
    title: "威豪健身總教官｜私教變現專家",
    businessHours: "週一至週六 09:00 - 21:00",
  },
  authUi: {
    googleAria: "使用 Google 帳號登入",
    lineAria: "使用 LINE 帳號登入",
  },

  heroSection: {
    title: "私教變現 系統\n把你的專業，變成穩定的收入",
    subtitle:
      "給私人教練的商業實戰培訓\n從體驗課成交、續約經營到個人品牌，一套可複製的變現系統",
    flipWords: ["系統", "軍師", "陪跑", "實戰"],
    ctaPrimary: "看變現方案",
    ctaSecondary: "預約 1 對 1 諮詢",
  },
  coachIntro: {
    tagline: "關於阿倫教官",
    name: "阿倫教官",
    title: "私教變現顧問",
    about:
      "教練職涯培訓講師、私教變現顧問。第一線私教出身，現任台東威豪健身總教官，統籌約 50 人的教練團隊，負責業績與續約 KPI、教練育成與教學品質管理。十年產業經驗讓我很確定一件事：多數教練卡住的不是專業，是沒有一套把專業換成收入的系統。所以近年我把私教與管理的實戰方法整理成課程與陪跑，只教一件事——教練怎麼把技術變成穩定業績。",
    bullets: [
      "威豪健身 Pro Fitness 總教官｜統籌約 50 人教練團隊",
      "NSCA-CPT 美國肌力與體能協會私人教練認證",
      "TQUK 英國心理諮詢認證｜NLP 執行師",
      "逾 1000 小時教學與授課時數",
    ],
    cta: "完整經歷",
  },
  servicesSection: {
    tagline: "Services",
    title: "所有課程與服務",
    subtitle: "左右滑動看完整方案，點任一張卡看課程內容與價格。",
    defaultCategory: "課程",
    empty: "課程整理中，敬請期待。",
  },
  careerCarousel: {
    tagline: "Career Path",
    title: "我憑什麼教你做業績",
    subtitle:
      "教練變現這件事，我不是讀來的。賣過最難賣的東西、自己在第一線賣過課、也帶過一整團教練衝業績——這三段加起來，才是我現在能教你的原因。",
    clickHint: "點擊看下一段",
    experiences: {
      realtor: {
        period: "早期・業務時期",
        role: "房仲業務經紀人",
        org: "房仲不動產業",
        summary:
          "我的職涯不是從健身房開始的，是從房仲開始的。這段時間讓我學會的不是話術，是讀人。",
        bullets: [
          "開發、帶看、探詢需求、議價、促成，完整銷售流程跑過無數遍",
          "在被拒絕是日常的環境裡練出韌性",
          "看懂客戶說「我再考慮」時，真正在意的到底是什麼",
        ],
      },
      personalTrainer: {
        period: "轉職・入行",
        role: "私人教練",
        org: "成吉思汗健身（連鎖健身品牌）",
        summary:
          "我把業務時期的銷售能力直接搬進健身房，很快建立起穩定的私教客群。專業和銷售不是二選一，雙軌並進才走得遠。",
        bullets: [
          "做體能評估、身體組成分析與個人化課表",
          "同時負責諮詢、成交與續課，走完第一線私教的收入循環",
          "我教的每一套成交流程，都是自己親手跑過、被拒絕過、再修正出來的",
        ],
      },
      headCoach: {
        period: "現職・教練經理／總教官",
        role: "總教官",
        org: "威豪健身 Pro Fitness（台東）・現任",
        summary:
          "帶團隊之後我才真正看懂——一個人業績好是天賦，一整團業績都好，那是系統。",
        bullets: [
          "統籌約 50 人教練團隊：排班調度、教學品質管控、招募面試與客訴處理",
          "設定並追蹤業績與續約 KPI，建立教練育成與考核制度",
          "把「怎麼成交」「怎麼續約」拆成可以教、可以複製、可以考核的標準",
        ],
        highlightValue: "50 人",
        highlightLabel: "教練團隊",
      },
    },
  },
  testimonials: {
    tagline: "Student Reviews",
    title: "真實學員留言",
    subtitle: "這裡的每一則留言，都來自現役私人教練",
    avatarAlt: "學員",
    slideAlt: "學員見證",
    prev: "上一張",
    next: "下一張",
    groupLabel: "第 {n} 組",
    slideLabel: "第 {n} 張",
  },
  certifications: {
    tagline: "Credentials",
    title: "專業認證",
    certs: {
      nsca: { label: "NSCA-CPT", sub: "美國肌力與體能協會 私人教練認證" },
      tquk: { label: "TQUK Level 3", sub: "英國認證心理諮詢" },
      nlp: { label: "NLP 執行師", sub: "神經語言程式學" },
      andaction: { label: "Andaction 生活教練", sub: "目標設定與行動陪伴" },
      fitnessC: { label: "健身教練 C 級", sub: "健身指導員培訓認證" },
      ace: { label: "ACE-CPT", sub: "美國運動委員會認證" },
      issa: { label: "ISSA-CPT", sub: "國際運動科學協會" },
    },
    stats: {
      team: { label: "50 人", sub: "教練團隊管理規模" },
      hours: { label: "1000+ 小時", sub: "教學與授課時數" },
      years: { label: "10 年", sub: "健身產業經歷" },
      episodes: { label: "58 集", sub: "《陪你健身》Podcast" },
      coaches: { label: "130+", sub: "協助提升收入的教練" },
      income: { label: "8 萬", sub: "個人私教月收入" },
    },
  },
  podcast: {
    tagline: "Podcast",
    title: "Podcast《陪你健身》",
    subtitle: "58 集完整節目，我方法論成形的過程",
    playEpisode: "播放本集",
    close: "關閉",
    categories: {
      training: "訓練",
      nutrition: "營養",
      mindset: "心態",
    },
    episodes: {
      ep1: {
        title: "EP20 續課八法",
        description: "把續約從「開口很尷尬」變成一套可執行的流程...",
        fullDescription:
          "開發一個新會員的成本，是維護一個舊會員的好幾倍。這集拆解續課的八個切入點：從課程中的成效回顧、時機判讀，到怎麼把續約談成「下一階段的規劃」而不是推銷。教練最該先補的一塊，通常就在這裡。",
      },
      ep2: {
        title: "EP22 SMARTER 目標設定",
        description: "會員做不到的目標，多半是一開始就設錯了...",
        fullDescription:
          "目標設定不是喊口號。這集用 SMARTER 架構逐項拆解：具體、可衡量、可達成、相關性、時限，再加上評估與調整兩步。學會之後，你不只能幫會員設目標，也能把自己的業績目標拆成每週做得完的動作。",
      },
      ep3: {
        title: "EP2 人類三大本能",
        description: "讀懂本能，才讀得懂會員為什麼說「我再想想」...",
        fullDescription:
          "所有溝通與成交的底層，都是人的本能反應。這集談趨吉避凶、追求認同與歸屬感三大本能如何影響決策，以及教練該怎麼在對話裡對準這些動機——這是我後來整套銷售心理學的起點。",
      },
    },
  },
  gallery: {
    tagline: "Gallery",
    title: "培訓現場",
    subtitle: "課程、講座、陪跑會議——實際發生過的現場",
    photoAlt: "相片 {n}",
    prev: "上一張",
    next: "下一張",
    slideLabel: "第 {n} 張",
    moments: {
      tagline: "Moments",
      title: "Moments",
      subtitle: "滑過每張照片，看看數字之外的東西",
    },
  },
  homePopup: {
    close: "關閉",
    logoTitle: "阿倫教官",
    cta: "開始探索",
  },

  aboutPage: {
    seo: {
      // SEOHead 會自動接上「| 阿倫教官 | Coach Aaron」，這裡不再重複品牌名
      title: "關於阿倫教官 ｜ 私教變現顧問",
      description:
        "阿倫教官（Coach Aaron）｜私教變現顧問、教練職涯培訓講師。第一線私教出身，現任台東威豪健身總教官，統籌約 50 人教練團隊。純 B2B，專教教練把專業變成穩定收入：從房仲讀人、私教落地到帶團隊系統化的十年職涯經歷。",
      keywords: [
        "阿倫教官",
        "Coach Aaron",
        "私教變現顧問",
        "教練職涯培訓",
        "私人教練培訓",
        "威豪健身總教官",
        "教練經理",
        "健身教練變現",
        "教練育成",
        "私教變現",
      ],
      author: "阿倫教官",
      breadcrumb: "關於阿倫教官",
    },
    hero: {
      title: "阿倫教官 Coach Aaron",
      subtitle: "私教變現顧問 ｜ 教練職涯培訓講師",
      leadBefore: "第一線私教出身，現任台東威豪健身總教官，",
      leadHighlight: "專教教練把專業變成穩定收入。",
    },
    timeline: {
      heading: "職涯時間軸",
      items: [
        {
          period: "早期・業務時期",
          role: "房仲業務經紀人",
          org: "房仲不動產業",
          summary:
            "職涯不是從健身房開始的，是從房仲開始的；學會的不是話術，是讀人。",
          points: [
            "完整銷售流程跑過無數遍",
            "在被拒絕是日常的環境練出韌性",
            "看懂客戶「我再考慮」背後真正在意什麼",
          ],
          imageAlt: "阿倫教官早期業務時期",
        },
        {
          period: "轉職・入行",
          role: "私人教練",
          org: "成吉思汗健身（連鎖健身品牌）",
          summary:
            "把業務時期的銷售能力搬進健身房，快速建立穩定私教客群；專業與銷售雙軌並進。",
          points: [
            "體能評估、身體組成分析、個人化課表",
            "同時負責諮詢、成交與續課",
            "走完第一線私教收入循環",
          ],
          imageAlt: "阿倫教官私人教練時期",
        },
        {
          period: "現職・教練經理／總教官",
          role: "教練經理／總教官",
          org: "威豪健身 Pro Fitness（台東）",
          summary:
            "帶團隊後才真正看懂——一個人業績好是天賦，一整團都好是系統。",
          points: [
            "統籌約 50 人教練團隊（排班、教學品質、招募、客訴）",
            "設定並追蹤業績與續約 KPI",
            "建立教練育成與考核制度",
          ],
          imageAlt: "阿倫教官現任總教官帶團隊",
        },
      ],
    },
    certifications: {
      heading: "專業證照",
      items: [
        "NSCA-CPT（美國肌力與體能協會 私人教練認證）",
        "TQUK 英國心理諮詢認證",
        "NLP 執行師",
        "Andaction 生活教練",
        "健身教練 C 級",
      ],
    },
    stats: {
      heading: "成就數據",
      items: [
        { value: "10 年", label: "產業經驗" },
        { value: "約 50 人", label: "統籌教練團隊" },
        { value: "1000+ 小時", label: "教學與授課" },
        { value: "130+", label: "協助教練提升收入" },
        { value: "58 集", label: "Podcast《陪你健身》" },
        { value: "冠軍", label: "2019 Fit Model 174cm 組" },
      ],
    },
    story: {
      heading: "我的職涯故事",
      p1Before:
        "我的職涯不是從健身房開始的，是從房仲開始的。在被拒絕是日常的環境裡，我沒學會什麼漂亮話術，反而練出一件更值錢的能力——",
      p1Highlight: "讀人",
      p1After: "，聽懂客戶那句「我再考慮」背後真正在意的是什麼。",
      p2: "轉行當私人教練之後，我把這套本事搬進健身房，很快建立起穩定客群，走完諮詢、成交到續課的完整收入循環。帶團隊後我才真正看懂——一個人業績好是天賦，一整團都好是系統。於是我把私教與管理的實戰整理成方法：從讀人、成交，到把它變成可以複製的制度。",
      p3Before: "現在我只教一件事——",
      p3Highlight: "教練怎麼把技術變成穩定業績。",
      p3After:
        "這條路我自己從頭走過一遍，也帶著上百位教練走過，我知道卡在哪、也知道怎麼過。",
    },
    cta: {
      title: "準備把專業變成穩定收入？",
      subtitle: "不論你想先看變現方案，還是直接一對一聊聊你的卡點，我都在。",
      primary: "看變現方案",
      secondary: "預約 1 對 1 諮詢",
    },
  },
  appInstall: {
    seo: {
      title: "把網站變成 APP",
      description:
        "30 秒把阿倫教官加入手機主畫面，像 APP 一樣使用：iOS Safari 與 Android Chrome 圖解教學，不用 App Store、不佔空間。",
      breadcrumb: "變成 APP",
    },
    header: {
      title: "把網站變成 APP",
      subtitle: "30 秒加入主畫面，不用 App Store、不佔空間",
    },
    phoneIconLabel: "阿倫教官",
    afterInstallNote:
      "完成後，主畫面就會出現「阿倫教官」，點開就是全螢幕 APP 體驗。",
    installedMsg: "已安裝完成，去主畫面找「阿倫教官」吧！",
    installBtn: "⚡ 一鍵安裝到主畫面",
    ios: {
      heading: "iPhone / iPad（Safari）",
      steps: [
        {
          title: "用 Safari 開啟本站",
          desc: "iOS 只有 Safari 能加入主畫面，其他瀏覽器要先切回 Safari。",
        },
        {
          title: "點底部「分享」按鈕",
          desc: "網址列旁邊那顆「方框 + 向上箭頭」的圖示。",
        },
        {
          title: "選「加入主畫面」",
          desc: "在分享選單往下滑一點就會看到。",
        },
        {
          title: "點右上角「加入」",
          desc: "完成！主畫面會出現阿倫教官的 icon。",
        },
      ],
    },
    android: {
      heading: "Android（Chrome）",
      steps: [
        {
          title: "用 Chrome 開啟本站",
          desc: "Samsung Internet、Edge 等主流瀏覽器也支援，步驟大同小異。",
        },
        {
          title: "點右上角「⋮」選單",
          desc: "或直接點畫面下方跳出的「安裝」提示條，一步到位。",
        },
        {
          title: "選「安裝應用程式」",
          desc: "舊版 Chrome 叫「加入主畫面」，是同一件事。",
        },
        {
          title: "確認安裝",
          desc: "完成！APP 會出現在主畫面與應用程式列表。",
        },
      ],
    },
    footnote:
      "這是 PWA（漸進式網頁應用）技術：不經過 App Store、幾乎不佔手機空間，內容永遠和網站同步更新。移除方式與一般 APP 相同（長按 icon → 移除）。",
  },
  homeSeo: {
    title: "私教變現專家 | 銷售心理學助健身教練月入8萬",
    description:
      "10年健身產業經驗，整合銷售心理學與實戰技巧。專為私人教練打造的業績突破系統，已協助130+教練年收破百萬。不擅長銷售？學生續約卡關？讓阿倫教官幫你把專業換成穩定收入，100天月入8萬起。",
    keywords: [
      "阿倫教官",
      "私人教練變現",
      "銷售心理學",
      "健身教練續課",
      "教練業績提升",
      "健身房銷售",
      "學生續約技巧",
      "健身教練收入",
      "教練培訓",
      "NLP心理學",
      "健身教練行銷",
      "私教經營",
      "教練職涯發展",
      "私人教練銷售",
      "健身教練銷售",
      "皮拉提斯銷售",
      "私教變現陪跑",
      "教練變現線上課程",
      "教練一對一顧問",
      "教練經理",
      "健身總教官",
    ],
    author: "阿倫教官",
  },
  contactExtra: {
    seoKeywords: [
      "聯絡阿倫教官",
      "教練諮詢",
      "免費諮詢",
      "私人教練培訓",
      "私人教練銷售",
      "健身教練銷售",
      "皮拉提斯銷售",
      "阿倫教官LINE",
      "教練業績提升",
    ],
    badges: {
      nsca: "NSCA-CPT 認證",
      tquk: "TQUK 心理諮詢師",
      nlp: "NLP 心理執行師",
      coachesTrained: "130+ 教練培訓",
    },
    social: {
      lineOfficialName: "LINE 官方",
      lineGroupName: "LINE 社群",
      lineGroupDesc: "私人教練專業變現",
      facebookDesc: "阿倫教官",
      podcastDesc: "陪你健身",
      notionDesc: "教練筆記",
    },
    hoverHint: "Hover 查看，點擊前往",
    sending: "送出中...",
    validation: {
      nameMin: "請輸入至少 2 個字的姓名",
      nameMax: "姓名不能超過 50 個字",
      emailInvalid: "請輸入有效的電子郵件地址",
      phoneInvalid: "電話格式不正確",
      subjectRequired: "請輸入訊息主旨",
      subjectMax: "主旨不能超過 100 個字",
      messageMin: "訊息內容至少需要 10 個字",
      messageMax: "訊息內容不能超過 2000 個字",
    },
    errors: {
      sendFailed: "送出失敗",
      sendFailedRetry: "送出失敗，請稍後再試",
    },
  },
  authExtra: {
    brandLogoTitle: "阿倫教官 Coach Aaron",
    login: {
      // SEOHead 會自動接上「| 阿倫教官 | Coach Aaron」，這裡不要再帶品牌名
      seoTitle: "登入",
      sessionExpired: "登入已過期，請重新登入",
      loginFailed: "登入失敗，請檢查帳號密碼",
      oauth: {
        verifyFailed: "登入驗證失敗，請重試",
        denied: "您已取消授權登入",
        noCode: "登入授權失敗，請重試",
        invalidProfile: "無法取得帳號資訊",
        createFailed: "建立帳號失敗，請稍後再試",
        serverError: "伺服器錯誤，請稍後再試",
        generic: "登入失敗，請重試",
      },
    },
    register: {
      seoTitle: "註冊",
    },
  },

  coursesExtra: {
    subtitle: "探索專業健身課程，開啟你的訓練旅程",
    seoDescription:
      "給私人教練的商業培訓方案：變現陪跑、銷售心理學線上課程與一對一顧問，把你的專業變成穩定收入。已協助 130+ 位教練突破業績瓶頸。",
    seoKeywords: [
      "私人教練銷售",
      "健身教練銷售",
      "皮拉提斯銷售",
      "私教變現陪跑",
      "教練變現線上課程",
      "教練培訓",
      "阿倫教官",
    ],
  },
  courseDetailExtra: {
    notFound: "找不到課程",
    reviewPlaceholder: "分享你對這門課程的看法（可選）...",
    fallbackKeywords: ["健身", "課程", "訓練"],
  },
  videosExtra: {
    seoDescription:
      "免費的健身知識分享，提供訓練教學、營養指南、生活建議等多元影片內容。",
    seoKeywords: ["健身影片", "訓練教學", "營養指南", "健身知識"],
    totalCount: "共 {count} 部影片",
    loadingMore: "載入更多...",
    backToTop: "回到頂部",
  },
  lessonsPage: {
    title: "教學影片",
    subtitle: "深入解析訓練、營養與心理學，每集都附完整逐字稿",
    seoDescription: "完整的教練教學影片，含逐字稿，深入學習各種主題",
    seoKeywords: ["教學影片", "教練培訓", "健身教學", "逐字稿", "阿倫教官"],
    noLessons: "目前還沒有教學影片",
  },
  lessonDetail: {
    author: "阿倫教官",
    notFound: "影片不存在",
    backToLessons: "回到教學影片列表",
    transcript: "逐字稿",
    lines: "句",
    noTranscript: "這部影片還沒有逐字稿",
    transcriptHint: "下方為逐字稿；播放時可能會自動高亮（依 Loom 版本而定）",
    seekHint: "點任何一句可嘗試跳轉（部分 Loom 版本支援）",
    fallbackKeywords: ["教學影片", "健身教學", "阿倫教官"],
  },
  articlesExtra: {
    subtitle: "健身教練的專業分享與訓練心得",
    seoDescription:
      "健身教練的專業分享與訓練心得，提供健身新手入門指南、訓練技巧、營養建議等實用內容",
    seoKeywords: ["健身", "訓練", "教練", "健身知識", "運動"],
    loadFailed: "載入文章失敗",
  },
  articleDetailExtra: {
    notFound: "找不到文章",
    loadFailed: "載入文章失敗",
    defaultUser: "使用者",
  },
  },
  en: {
  layoutExtra: {
    brandName: "Coach Aaron",
    brandTagline: "Psychology × Fitness Education",
    rightsReserved: "All rights reserved",
    logoHomeAria: "Coach Aaron — home",
    userMenuAria: "User menu",
    menuAria: "Menu",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    bookConsult: "Book a consultation",
    myBookings: "My bookings",
    messages: "Messages",
    coachDashboard: "Coach dashboard",
    loginRegister: "Log in / Sign up",
    feedback: "Feedback",
  },
  coachInfo: {
    name: "Coach Aaron",
    title: "Head Coach, Pro Fitness | Business Coach for Personal Trainers",
    businessHours: "Monday to Saturday, 09:00 - 21:00",
  },
  authUi: {
    googleAria: "Sign in with Google",
    lineAria: "Sign in with LINE",
  },

  heroSection: {
    // ⚠️ 第一行最後一個詞（System）會被 flipWords 輪播替換，
    //    關鍵字 "Personal Trainer Revenue" 固定留在 <h1> 內。
    title:
      "The Personal Trainer Revenue System\nTurn your expertise into income you can count on",
    subtitle:
      "Business training built for personal trainers\nFrom closing the trial session to renewals and your own brand — one repeatable revenue system",
    flipWords: ["System", "Playbook", "Blueprint", "Engine"],
    ctaPrimary: "See the Programs",
    ctaSecondary: "Book a 1-on-1 Consult",
  },
  coachIntro: {
    tagline: "About Coach Aaron",
    name: "Coach Aaron",
    title: "Personal Training Revenue Consultant",
    about:
      "Career trainer for coaches, revenue consultant for personal trainers. I came up on the gym floor, and I'm now Head Coach at Pro Fitness in Taitung, where I lead a team of around 50 trainers and own the revenue and renewal KPIs, coach development, and teaching quality. Ten years in this industry taught me one thing for certain: what holds most trainers back isn't their knowledge — it's not having a system that turns that knowledge into income. So I packaged what actually worked, on the floor and in management, into courses and hands-on mentoring, and I teach one thing only: how a coach turns skill into steady revenue.",
    bullets: [
      "Head Coach, Pro Fitness — leading a team of around 50 trainers",
      "NSCA-CPT — Certified Personal Trainer, National Strength and Conditioning Association",
      "TQUK-accredited counselling qualification | Licensed NLP Practitioner",
      "1,000+ hours of coaching and teaching delivered",
    ],
    cta: "Full Background",
  },
  servicesSection: {
    tagline: "Services",
    title: "Programs & Services",
    subtitle:
      "Swipe through the full lineup, then tap any card for what's inside and what it costs.",
    defaultCategory: "Program",
    empty: "Programs are being finalized — check back soon.",
  },
  careerCarousel: {
    tagline: "Career Path",
    title: "Why I'm Qualified to Teach You Sales",
    subtitle:
      "I didn't learn how to monetize coaching from a book. I sold one of the hardest products there is, sold my own sessions on the gym floor, then led an entire team to hit its numbers. Those three chapters together are why I can teach you this.",
    clickHint: "Click for the next chapter",
    experiences: {
      realtor: {
        period: "Early Years · Sales",
        role: "Real Estate Sales Agent",
        org: "Residential Real Estate",
        summary:
          "My career didn't start in a gym — it started in real estate. What that time taught me wasn't scripts. It was how to read people.",
        bullets: [
          "Ran the full sales cycle countless times: prospecting, showings, needs discovery, negotiation, close",
          "Built real resilience in an environment where rejection was the daily norm",
          "Learned what a client actually cares about when they say \"let me think about it\"",
        ],
      },
      personalTrainer: {
        period: "Career Change · Entering the Industry",
        role: "Personal Trainer",
        org: "Genghis Khan Fitness (national gym chain)",
        summary:
          "I brought my sales ability straight onto the gym floor and built a steady client base fast. Expertise and selling aren't an either/or — you only go far running both.",
        bullets: [
          "Delivered fitness assessments, body composition analysis, and individualized programming",
          "Owned consultation, closing, and renewals — the complete revenue cycle of a floor trainer",
          "Every closing process I teach is one I ran myself, got rejected on, and rebuilt",
        ],
      },
      headCoach: {
        period: "Current · Coach Manager / Head Coach",
        role: "Head Coach",
        org: "Pro Fitness, Taitung · Present",
        summary:
          "Leading a team is what finally made it click: one person hitting their numbers is talent. A whole team hitting them is a system.",
        bullets: [
          "Lead a team of around 50 trainers: scheduling, teaching-quality control, hiring, and client escalations",
          "Set and track revenue and renewal KPIs; built the coach development and review framework",
          "Broke closing and renewals down into standards that can be taught, repeated, and measured",
        ],
        highlightValue: "50",
        highlightLabel: "Trainers Led",
      },
    },
  },
  testimonials: {
    tagline: "Coach Feedback",
    title: "What Coaches Are Saying",
    subtitle: "Every message here comes from a working personal trainer.",
    avatarAlt: "Coach",
    slideAlt: "Coach testimonial",
    prev: "Previous",
    next: "Next",
    groupLabel: "Group {n}",
    slideLabel: "Slide {n}",
  },
  certifications: {
    tagline: "Credentials",
    title: "Certifications",
    certs: {
      nsca: {
        label: "NSCA-CPT",
        sub: "Certified Personal Trainer, National Strength and Conditioning Association",
      },
      tquk: {
        label: "TQUK Level 3",
        sub: "UK-accredited counselling qualification",
      },
      nlp: { label: "NLP Practitioner", sub: "Neuro-Linguistic Programming" },
      andaction: {
        label: "Andaction Life Coach",
        sub: "Goal setting and accountability coaching",
      },
      fitnessC: {
        label: "Fitness Instructor, Level C",
        sub: "Certified fitness instructor training",
      },
      ace: { label: "ACE-CPT", sub: "American Council on Exercise certified" },
      issa: {
        label: "ISSA-CPT",
        sub: "International Sports Sciences Association",
      },
    },
    stats: {
      team: { label: "50", sub: "Trainers on the team I lead" },
      hours: { label: "1,000+ hrs", sub: "Of coaching and teaching delivered" },
      years: { label: "10 yrs", sub: "In the fitness industry" },
      episodes: { label: "58 eps", sub: "The Training With You podcast" },
      coaches: { label: "130+", sub: "Coaches helped to grow their income" },
      income: { label: "NT$80K", sub: "Personal monthly training income" },
    },
  },
  podcast: {
    tagline: "Podcast",
    title: "The Training With You Podcast",
    subtitle: "58 full episodes — the making of the method I teach today.",
    playEpisode: "Play Episode",
    close: "Close",
    categories: {
      training: "Training",
      nutrition: "Nutrition",
      mindset: "Mindset",
    },
    episodes: {
      ep1: {
        title: "EP20 Eight Ways to Win the Renewal",
        description:
          "Turn renewals from an awkward ask into a process you can actually run...",
        fullDescription:
          "Winning a new client costs several times more than keeping the one you already have. This episode breaks renewals into eight entry points: running progress reviews inside the session, reading the right moment, and framing the renewal as the next phase of a plan rather than a pitch. For most coaches, this is the first gap worth closing.",
      },
      ep2: {
        title: "EP22 SMARTER Goal Setting",
        description:
          "When a client can't hit the goal, the goal was usually set wrong from the start...",
        fullDescription:
          "Goal setting isn't a pep talk. This episode walks the SMARTER framework point by point — specific, measurable, achievable, relevant, time-bound — plus the evaluate and readjust steps almost everyone skips. Once you have it, you can set goals your clients actually reach, and break your own revenue targets into work you can finish this week.",
      },
      ep3: {
        title: "EP2 The Three Human Instincts",
        description:
          "Read the instincts and you'll finally understand why a client says \"let me think about it\"...",
        fullDescription:
          "Underneath every conversation and every close sit basic human instincts. This episode covers three — moving toward gain and away from loss, seeking recognition, and seeking belonging — how they drive decisions, and how a coach can speak to them directly in conversation. This is where my whole sales psychology approach began.",
      },
    },
  },
  gallery: {
    tagline: "Gallery",
    title: "Training in Action",
    subtitle:
      "Workshops, talks, mentoring sessions — real rooms where the work happened.",
    photoAlt: "Photo {n}",
    prev: "Previous",
    next: "Next",
    slideLabel: "Slide {n}",
    moments: {
      tagline: "Moments",
      title: "Moments",
      subtitle: "Hover any photo for the side of this work the numbers miss.",
    },
  },
  homePopup: {
    close: "Close",
    logoTitle: "Coach Aaron",
    cta: "Start Exploring",
  },

  aboutPage: {
    seo: {
      title: "About Coach Aaron — Business Coach for Personal Trainers",
      description:
        "Coach Aaron — business consultant and career trainer for personal trainers. A former front-line PT, now Head Coach at Pro Fitness Taitung leading a team of around 50 trainers. Strictly B2B: he teaches coaches how to turn their expertise into stable income, drawing on ten years from reading people in real estate, to building a client base on the gym floor, to running a coaching team.",
      keywords: [
        "Coach Aaron",
        "business coaching for personal trainers",
        "fitness sales training",
        "personal trainer career development",
        "personal trainer income",
        "fitness industry consultant",
        "client retention for trainers",
        "gym sales training",
        "personal training business",
        "coach mentoring program",
      ],
      author: "Coach Aaron",
      breadcrumb: "About Coach Aaron",
    },
    hero: {
      title: "Coach Aaron",
      subtitle:
        "Business Consultant for Personal Trainers | Coach Career Trainer",
      leadBefore:
        "A front-line personal trainer turned Head Coach at Pro Fitness Taitung — ",
      leadHighlight: "I teach coaches how to turn expertise into stable income.",
    },
    timeline: {
      heading: "Career Timeline",
      items: [
        {
          period: "Early Years · Sales",
          role: "Real Estate Sales Agent",
          org: "Real Estate Industry",
          summary:
            "My career didn't start in a gym — it started in real estate. What I picked up there wasn't scripts. It was how to read people.",
          points: [
            "Ran the full sales cycle hundreds of times over",
            "Built resilience in an environment where rejection was routine",
            'Learned what a client really means by "let me think about it"',
          ],
          imageAlt: "Coach Aaron during his early sales career",
        },
        {
          period: "Career Change · Entering Fitness",
          role: "Personal Trainer",
          org: "Genghis Khan Fitness (national gym chain)",
          summary:
            "I brought my sales ability onto the gym floor and built a steady client base fast — coaching craft and selling craft growing side by side.",
          points: [
            "Fitness assessments, body composition analysis, individualized programming",
            "Owned consultation, closing and renewals end to end",
            "Completed the full front-line personal training income cycle",
          ],
          imageAlt: "Coach Aaron working as a personal trainer",
        },
        {
          period: "Current Role · Coach Manager / Head Coach",
          role: "Coach Manager / Head Coach",
          org: "Pro Fitness (Taitung)",
          summary:
            "Leading a team is what finally made it click — one trainer performing is talent; a whole team performing is a system.",
          points: [
            "Lead a team of roughly 50 trainers (scheduling, coaching quality, hiring, escalations)",
            "Set and track revenue and renewal KPIs",
            "Built the trainer development and performance review system",
          ],
          imageAlt: "Coach Aaron leading his team as Head Coach",
        },
      ],
    },
    certifications: {
      heading: "Certifications",
      items: [
        "NSCA-CPT (Certified Personal Trainer, National Strength and Conditioning Association)",
        "TQUK Certified Counselling Practitioner (UK)",
        "NLP Practitioner",
        "Andaction Life Coach",
        "Fitness Instructor, Level C",
      ],
    },
    stats: {
      heading: "By the Numbers",
      items: [
        { value: "10 Years", label: "In the Industry" },
        { value: "~50", label: "Trainers on the Team He Leads" },
        { value: "1,000+ Hours", label: "Coaching and Teaching" },
        { value: "130+", label: "Trainers Helped to Higher Income" },
        { value: "58 Episodes", label: '"Training With You" Podcast' },
        { value: "1st Place", label: "2019 Fit Model, 174cm Division" },
      ],
    },
    story: {
      heading: "My Story",
      p1Before:
        "My career didn't start in a gym — it started in real estate. In a job where rejection was the daily norm, I never picked up slick scripts. I picked up something worth far more: ",
      p1Highlight: "reading people",
      p1After:
        ' — hearing what a client actually cares about behind that "let me think about it."',
      p2: "When I moved into personal training, I brought that skill onto the gym floor. I built a steady client base quickly and ran the full income cycle: consultation, close, renewal. It was only after I started leading a team that I really understood — one trainer performing is talent, a whole team performing is a system. So I turned everything I'd learned on the floor and in management into a method: from reading people, to closing, to making it repeatable.",
      p3Before: "These days I teach one thing — ",
      p3Highlight: "how coaches turn their skill into consistent revenue.",
      p3After:
        " I've walked this road from the start myself, and I've walked it with hundreds of coaches. I know where it stalls, and I know how to get through.",
    },
    cta: {
      title: "Ready to turn your expertise into stable income?",
      subtitle:
        "Whether you want to look at the programs first or talk through what's blocking you one-on-one, I'm here.",
      primary: "See the Programs",
      secondary: "Book a 1-on-1 Consultation",
    },
  },
  appInstall: {
    seo: {
      title: "Install This Site as an App",
      description:
        "Add Coach Aaron to your phone's home screen in 30 seconds and use it like a native app: illustrated steps for iOS Safari and Android Chrome. No App Store, no storage taken up.",
      breadcrumb: "Install as App",
    },
    header: {
      title: "Turn This Site Into an App",
      subtitle:
        "On your home screen in 30 seconds — no App Store, no storage used",
    },
    phoneIconLabel: "Coach Aaron",
    afterInstallNote:
      'Once it\'s done, "Coach Aaron" appears on your home screen — tap it for a full-screen app experience.',
    installedMsg: 'Installed! Look for "Coach Aaron" on your home screen.',
    installBtn: "⚡ Install to Home Screen",
    ios: {
      heading: "iPhone / iPad (Safari)",
      steps: [
        {
          title: "Open this site in Safari",
          desc: "On iOS, only Safari can add to the home screen — switch back to Safari if you're in another browser.",
        },
        {
          title: 'Tap the "Share" button at the bottom',
          desc: "It's the square-with-an-up-arrow icon next to the address bar.",
        },
        {
          title: 'Choose "Add to Home Screen"',
          desc: "Scroll down a little in the share sheet and you'll see it.",
        },
        {
          title: 'Tap "Add" in the top right',
          desc: "Done! The Coach Aaron icon appears on your home screen.",
        },
      ],
    },
    android: {
      heading: "Android (Chrome)",
      steps: [
        {
          title: "Open this site in Chrome",
          desc: "Samsung Internet, Edge and other major browsers work too — the steps are nearly identical.",
        },
        {
          title: 'Tap the "⋮" menu in the top right',
          desc: 'Or just tap the "Install" banner that pops up at the bottom of the screen — one step, done.',
        },
        {
          title: 'Choose "Install app"',
          desc: 'Older versions of Chrome call it "Add to Home screen" — same thing.',
        },
        {
          title: "Confirm the install",
          desc: "Done! The app appears on your home screen and in your app list.",
        },
      ],
    },
    footnote:
      "This uses PWA (Progressive Web App) technology: no App Store, almost no storage used, and the content always stays in sync with the website. Remove it the same way as any app (press and hold the icon → Remove).",
  },
  homeSeo: {
    title:
      "Turn Coaching Skill Into Steady Income | Sales Training for Personal Trainers",
    description:
      "Ten years in the fitness industry, combining sales psychology with what actually works on the gym floor. A revenue system built for personal trainers — 130+ coaches already helped past NT$1M in annual income. Not a natural at selling? Clients not renewing? Coach Aaron helps you turn your expertise into stable income, starting at NT$80,000 a month within 100 days.",
    keywords: [
      "Coach Aaron",
      "personal trainer sales training",
      "fitness coach business growth",
      "client retention for personal trainers",
      "personal trainer income",
      "sales psychology for trainers",
      "gym sales coaching",
      "personal trainer career development",
      "fitness business consultant",
      "NLP sales training",
      "fitness coach marketing",
      "personal training business management",
      "pilates instructor sales training",
      "client renewal techniques",
      "online course for personal trainers",
      "1-on-1 consulting for coaches",
      "coach manager",
      "head coach fitness",
    ],
    author: "Coach Aaron",
  },
  contactExtra: {
    seoKeywords: [
      "contact Coach Aaron",
      "personal trainer consultation",
      "free coaching consultation",
      "personal trainer business training",
      "fitness sales coaching",
      "pilates instructor sales training",
      "Coach Aaron LINE",
      "trainer revenue growth",
    ],
    badges: {
      nsca: "NSCA-CPT Certified",
      tquk: "TQUK Counselling Practitioner",
      nlp: "NLP Practitioner",
      coachesTrained: "130+ Coaches Trained",
    },
    social: {
      lineOfficialName: "LINE Official",
      lineGroupName: "LINE Community",
      lineGroupDesc: "Personal Trainer Income Growth",
      facebookDesc: "Coach Aaron",
      podcastDesc: "Training With You",
      notionDesc: "Coach Notes",
    },
    hoverHint: "Hover to preview, click to open",
    sending: "Sending...",
    validation: {
      nameMin: "Please enter a name of at least 2 characters",
      nameMax: "Name cannot exceed 50 characters",
      emailInvalid: "Please enter a valid email address",
      phoneInvalid: "Phone number format is invalid",
      subjectRequired: "Please enter a subject",
      subjectMax: "Subject cannot exceed 100 characters",
      messageMin: "Message must be at least 10 characters",
      messageMax: "Message cannot exceed 2000 characters",
    },
    errors: {
      sendFailed: "Failed to send",
      sendFailedRetry: "Failed to send. Please try again later.",
    },
  },
  authExtra: {
    brandLogoTitle: "Coach Aaron",
    login: {
      seoTitle: "Login",
      sessionExpired: "Your session has expired. Please sign in again.",
      loginFailed: "Login failed. Please check your email and password.",
      oauth: {
        verifyFailed: "Login verification failed. Please try again.",
        denied: "You cancelled the authorization.",
        noCode: "Authorization failed. Please try again.",
        invalidProfile: "Couldn't retrieve your account information.",
        createFailed: "Couldn't create your account. Please try again later.",
        serverError: "Server error. Please try again later.",
        generic: "Login failed. Please try again.",
      },
    },
    register: {
      seoTitle: "Register",
    },
  },

  coursesExtra: {
    subtitle:
      "Business programs built for personal trainers who want their expertise to pay",
    seoDescription:
      "Business training for personal trainers: monetization coaching, sales psychology courses and 1-on-1 consulting that turn your expertise into steady income. 130+ coaches have broken through their revenue ceiling with Coach Aaron.",
    seoKeywords: [
      "personal trainer sales training",
      "fitness coach business course",
      "pilates instructor sales",
      "personal training business coaching",
      "grow your personal training business",
      "trainer client retention",
      "Coach Aaron",
    ],
  },
  courseDetailExtra: {
    notFound: "Course not found",
    reviewPlaceholder: "Share what this course did for your business (optional)...",
    fallbackKeywords: [
      "personal trainer course",
      "fitness business training",
      "coaching skills",
    ],
  },
  videosExtra: {
    seoDescription:
      "Free short-form coaching clips: sales conversations, client retention and the business side of personal training.",
    seoKeywords: [
      "personal trainer tips",
      "fitness coaching reels",
      "trainer sales tips",
      "fitness business advice",
    ],
    totalCount: "{count} videos",
    loadingMore: "Loading more...",
    backToTop: "Back to top",
  },
  lessonsPage: {
    title: "Lessons",
    subtitle:
      "In-depth breakdowns of sales, retention and coaching psychology — every lesson comes with a full transcript",
    seoDescription:
      "In-depth coaching lessons with full transcripts, covering sales conversations, client retention and running a profitable training business.",
    seoKeywords: [
      "personal trainer lessons",
      "coaching business training",
      "fitness sales training",
      "trainer education",
      "Coach Aaron",
    ],
    noLessons: "No lessons available yet",
  },
  lessonDetail: {
    author: "Coach Aaron",
    notFound: "Lesson not found",
    backToLessons: "Back to lessons",
    transcript: "Transcript",
    lines: "lines",
    noTranscript: "No transcript available for this lesson yet",
    transcriptHint:
      "The transcript is below — it follows along with playback where Loom supports it",
    seekHint: "Tap any line to jump to that moment (where supported)",
    fallbackKeywords: [
      "coaching lesson",
      "personal trainer training",
      "Coach Aaron",
    ],
  },
  articlesExtra: {
    subtitle:
      "Practical insights on selling, retaining clients and building a coaching business",
    seoDescription:
      "Practical articles for personal trainers: sales conversations that convert, client retention, pricing your packages and building a coaching business that pays.",
    seoKeywords: [
      "personal trainer business tips",
      "fitness coaching sales",
      "client retention for trainers",
      "personal training pricing",
      "fitness business growth",
    ],
    loadFailed: "Failed to load articles",
  },
  articleDetailExtra: {
    notFound: "Article not found",
    loadFailed: "Failed to load the article",
    defaultUser: "Member",
  },
  },
};
