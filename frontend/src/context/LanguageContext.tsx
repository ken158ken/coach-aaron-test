/**
 * 語言上下文 - 管理中英文切換
 * @module context/LanguageContext
 */

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";

/** 語言類型 */
export type Language = "zh-TW" | "en";

/** 翻譯文字 */
export interface Translations {
  // 導航
  nav: {
    home: string;
    courses: string;
    videos: string;
    articles: string;
    contact: string;
    photos: string;
    login: string;
    logout: string;
    register: string;
    memberCenter: string;
    admin: string;
    landingPages: string;
  };
  // 通用
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    all: string;
    draft: string;
    published: string;
    back: string;
    next: string;
    prev: string;
    submit: string;
    confirm: string;
  };
  // 主題
  theme: {
    light: string;
    dark: string;
    toggle: string;
  };
  // 文章
  article: {
    title: string;
    list: string;
    detail: string;
    author: string;
    views: string;
    ratings: string;
    comments: string;
    noContent: string;
    backToList: string;
    featured: string;
    rateThis: string;
    loginToRate: string;
    loginToComment: string;
    noComments: string;
    beFirst: string;
    shareThoughts: string;
    submitComment: string;
    reply: string;
    cancelReply: string;
  };
  // 課程
  course: {
    title: string;
    list: string;
    detail: string;
    price: string;
    duration: string;
    level: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    allLevels: string;
    enroll: string;
  };
  // 後台
  admin: {
    dashboard: string;
    users: string;
    courses: string;
    articles: string;
    videos: string;
    whitelist: string;
    landingPages: string;
    newArticle: string;
    newCourse: string;
    saveDraft: string;
    publish: string;
    manageCategories: string;
  };
}

/** 中文翻譯 */
const zhTW: Translations = {
  nav: {
    home: "教練介紹",
    courses: "線上課程",
    videos: "短影音",
    articles: "專業知識",
    contact: "聯絡我",
    photos: "阿倫私密淫照",
    login: "登入",
    logout: "登出",
    register: "註冊",
    memberCenter: "會員中心",
    admin: "後台",
    landingPages: "自訂頁面",
  },
  common: {
    loading: "載入中...",
    error: "發生錯誤",
    success: "成功",
    save: "儲存",
    cancel: "取消",
    delete: "刪除",
    edit: "編輯",
    create: "新增",
    search: "搜尋",
    filter: "篩選",
    all: "全部",
    draft: "草稿",
    published: "已發布",
    back: "返回",
    next: "下一頁",
    prev: "上一頁",
    submit: "送出",
    confirm: "確認",
  },
  theme: {
    light: "淺色模式",
    dark: "深色模式",
    toggle: "切換主題",
  },
  article: {
    title: "文章",
    list: "文章列表",
    detail: "文章詳情",
    author: "作者",
    views: "次瀏覽",
    ratings: "個評分",
    comments: "留言",
    noContent: "文章內容尚未撰寫",
    backToList: "返回文章列表",
    featured: "精選文章",
    rateThis: "為這篇文章評分",
    loginToRate: "登入後即可評分",
    loginToComment: "登入後即可留言",
    noComments: "尚無留言，成為第一個留言的人吧！",
    beFirst: "成為第一個留言的人",
    shareThoughts: "分享你的想法...",
    submitComment: "送出留言",
    reply: "回覆",
    cancelReply: "取消回覆",
  },
  course: {
    title: "課程",
    list: "課程列表",
    detail: "課程詳情",
    price: "價格",
    duration: "時長",
    level: "難度",
    beginner: "初學者",
    intermediate: "中級",
    advanced: "高級",
    allLevels: "所有程度",
    enroll: "立即報名",
  },
  admin: {
    dashboard: "儀表板",
    users: "用戶管理",
    courses: "課程管理",
    articles: "文章管理",
    videos: "影片管理",
    whitelist: "白名單管理",
    landingPages: "自訂頁面",
    newArticle: "新增文章",
    newCourse: "新增課程",
    saveDraft: "儲存草稿",
    publish: "發布",
    manageCategories: "管理分類",
  },
};

/** 英文翻譯 */
const en: Translations = {
  nav: {
    home: "About Coach",
    courses: "Courses",
    videos: "Videos",
    articles: "Articles",
    contact: "Contact",
    photos: "Private Photos",
    login: "Login",
    logout: "Logout",
    register: "Register",
    memberCenter: "Member Center",
    admin: "Admin",
    landingPages: "Landing Pages",
  },
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
    filter: "Filter",
    all: "All",
    draft: "Draft",
    published: "Published",
    back: "Back",
    next: "Next",
    prev: "Previous",
    submit: "Submit",
    confirm: "Confirm",
  },
  theme: {
    light: "Light Mode",
    dark: "Dark Mode",
    toggle: "Toggle Theme",
  },
  article: {
    title: "Article",
    list: "Articles",
    detail: "Article Detail",
    author: "Author",
    views: "views",
    ratings: "ratings",
    comments: "Comments",
    noContent: "Content not available",
    backToList: "Back to Articles",
    featured: "Featured",
    rateThis: "Rate this article",
    loginToRate: "Login to rate",
    loginToComment: "Login to comment",
    noComments: "No comments yet. Be the first to comment!",
    beFirst: "Be the first to comment",
    shareThoughts: "Share your thoughts...",
    submitComment: "Submit Comment",
    reply: "Reply",
    cancelReply: "Cancel Reply",
  },
  course: {
    title: "Course",
    list: "Courses",
    detail: "Course Detail",
    price: "Price",
    duration: "Duration",
    level: "Level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    allLevels: "All Levels",
    enroll: "Enroll Now",
  },
  admin: {
    dashboard: "Dashboard",
    users: "Users",
    courses: "Courses",
    articles: "Articles",
    videos: "Videos",
    whitelist: "Whitelist",
    landingPages: "Landing Pages",
    newArticle: "New Article",
    newCourse: "New Course",
    saveDraft: "Save Draft",
    publish: "Publish",
    manageCategories: "Manage Categories",
  },
};

/** 翻譯字典 */
const translations: Record<Language, Translations> = {
  "zh-TW": zhTW,
  en: en,
};

interface LanguageContextType {
  /** 當前語言 */
  language: Language;
  /** 設置語言 */
  setLanguage: (lang: Language) => void;
  /** 切換語言 */
  toggleLanguage: () => void;
  /** 取得翻譯 */
  t: Translations;
  /** 是否為中文 */
  isZhTW: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "app_language";

interface LanguageProviderProps {
  children: React.ReactNode;
}

/**
 * Language Provider 元件
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  // ✅ SSR-safe：初始值使用固定預設，避免 server/client 不一致
  const [language, setLanguageState] = useState<Language>("zh-TW");

  // ✅ hydration 完成後才從 localStorage 讀取使用者偏好
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh-TW") {
      setLanguageState(saved);
    }
  }, []);

  /**
   * 設置語言
   */
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
    }
  }, []);

  /**
   * 切換語言
   */
  const toggleLanguage = useCallback(() => {
    setLanguage(language === "zh-TW" ? "en" : "zh-TW");
  }, [language, setLanguage]);

  /**
   * 初始化語言設定
   */
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language);
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language],
    isZhTW: language === "zh-TW",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * 使用語言上下文的 Hook
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;
