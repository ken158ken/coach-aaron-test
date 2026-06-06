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
    lessons: string;
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
    views: string;
    noData: string;
    page: string;
    of: string;
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
    pageLabel: string;
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
    popularArticles: string;
    submitReply: string;
  };
  // 課程
  course: {
    title: string;
    list: string;
    detail: string;
    pageLabel: string;
    price: string;
    duration: string;
    level: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    allLevels: string;
    enroll: string;
    free: string;
    lessons: string;
    reviews: string;
    rating: string;
    enrolled: string;
    accessDays: string;
    noCourses: string;
    backToList: string;
    loginToEnroll: string;
    alreadyOwned: string;
    addToCart: string;
    showPrice: string;
    noReviews: string;
    viewDetail: string;
    allCategories: string;
    noFilterMatch: string;
    clearFilters: string;
    inquirePrice: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaBook: string;
    intro: string;
    courseContent: string;
    whatYouLearn: string;
    studentReviews: string;
    buyNow: string;
    loginToBuy: string;
    rateThis: string;
    updateReview: string;
    submitReview: string;
    updateReviewBtn: string;
    submittingReview: string;
    loginToReview: string;
    purchaseToReview: string;
    anonymous: string;
    ratingLabel: string;
    includesVideos: string;
    includesPdf: string;
    includesUnlimited: string;
    includesCommunity: string;
    learnItem1: string;
    learnItem2: string;
    learnItem3: string;
    learnItem4: string;
    learnItem5: string;
    learnItem6: string;
  };
  // 影片
  videos: {
    pageLabel: string;
    heading: string;
    subheading: string;
    noVideos: string;
    searchPlaceholder: string;
    noSearchResults: string;
    clearSearch: string;
    totalCount: string;
    pageInfo: string;
    filterTraining: string;
    filterNutrition: string;
    filterLifestyle: string;
  };
  // 聯絡
  contact: {
    pageLabel: string;
    heading: string;
    subtitle: string;
    formSection: string;
    infoSection: string;
    socialSection: string;
    lineQuickContact: string;
    email: string;
    businessHours: string;
    formName: string;
    formEmail: string;
    formPhone: string;
    formSubject: string;
    formMessage: string;
    formSubmit: string;
    formNote: string;
    formSuccess: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
  };
  // 會員中心
  member: {
    pageLabel: string;
    heading: string;
    welcome: string;
    purchasedCourses: string;
    completedLessons: string;
    studyDays: string;
    personalInfo: string;
    myCourses: string;
    accountSettings: string;
    noCourses: string;
    displayName: string;
    phone: string;
    gender: string;
    male: string;
    female: string;
    other: string;
    saveChanges: string;
    saving: string;
    uploadAvatar: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    changePassword: string;
    browseCourses: string;
    changeAvatar: string;
    selectAvatar: string;
    removeAvatar: string;
    updateProfile: string;
    updating: string;
    member: string;
    profileUpdateSuccess: string;
    avatarUpdateSuccess: string;
    avatarUpdateFailed: string;
    avatarRemoved: string;
    avatarDeleteFailed: string;
    displayNameEmpty: string;
    displayNameTooLong: string;
    displayNameInvalid: string;
    displayNameCharset: string;
  };
  // 登入
  login: {
    heading: string;
    subtitle: string;
    email: string;
    password: string;
    forgotPassword: string;
    submit: string;
    submitting: string;
    noAccount: string;
    registerNow: string;
    orContinueWith: string;
  };
  // 註冊
  register: {
    heading: string;
    subtitle: string;
    username: string;
    name: string;
    email: string;
    displayName: string;
    phone: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    submit: string;
    submitting: string;
    hasAccount: string;
    loginNow: string;
    terms: string;
    orWith: string;
    passwordMismatch: string;
    passwordTooShort: string;
    successMsg: string;
  };
  // 結帳
  checkout: {
    heading: string;
    orderSummary: string;
    total: string;
    proceedToPayment: string;
    backToCourse: string;
    paymentMethod: string;
  };
  // 後台
  admin: {
    dashboard: string;
    users: string;
    courses: string;
    articles: string;
    videos: string;
    lessons: string;
    whitelist: string;
    landingPages: string;
    newArticle: string;
    newCourse: string;
    saveDraft: string;
    publish: string;
    manageCategories: string;
    export: string;
  };
  // 匯出
  exportFeature: {
    exportData: string;
    exportMyChats: string;
    exportFormat: string;
    exporting: string;
    exportSuccess: string;
    exportFailed: string;
    exportConversation: string;
    noConversations: string;
    messageCount: string;
    exportCenter: string;
    moduleExport: string;
    fullExport: string;
    fullExportDesc: string;
    fullExportBtn: string;
    selectFormat: string;
    formatMd: string;
    formatTxt: string;
    formatHtml: string;
    formatXlsx: string;
    formatDocx: string;
  };
}

/** 中文翻譯 */
const zhTW: Translations = {
  nav: {
    home: "教練介紹",
    courses: "線上課程",
    videos: "Reels",
    lessons: "教學影片",
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
    views: "次瀏覽",
    noData: "暫無資料",
    page: "第",
    of: "頁，共",
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
    pageLabel: "專業知識",
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
    popularArticles: "熱門文章",
    submitReply: "送出回覆",
  },
  course: {
    title: "課程",
    list: "課程列表",
    detail: "課程詳情",
    pageLabel: "線上課程",
    price: "價格",
    duration: "時長",
    level: "難度",
    beginner: "初學者",
    intermediate: "中級",
    advanced: "高級",
    allLevels: "所有程度",
    enroll: "立即報名",
    free: "免費",
    lessons: "堂課",
    reviews: "個評價",
    rating: "評分",
    enrolled: "已報名",
    accessDays: "天有效期",
    noCourses: "目前沒有符合的課程",
    backToList: "返回課程列表",
    loginToEnroll: "登入後即可報名",
    alreadyOwned: "已購買",
    addToCart: "加入購物車",
    showPrice: "查看售價",
    noReviews: "尚無評價",
    viewDetail: "查看詳情",
    allCategories: "全部分類",
    noFilterMatch: "沒有符合條件的課程",
    clearFilters: "清除篩選",
    inquirePrice: "洽詢價格",
    ctaTitle: "需要客製化訓練計畫？",
    ctaSubtitle: "我們提供一對一諮詢服務，根據你的目標制定專屬訓練方案",
    ctaBook: "預約諮詢",
    intro: "課程簡介",
    courseContent: "課程介紹",
    whatYouLearn: "你將學到",
    studentReviews: "學員評價",
    buyNow: "立即購買",
    loginToBuy: "登入後購買",
    rateThis: "為此課程評分",
    updateReview: "更新你的評價",
    submitReview: "送出評價",
    updateReviewBtn: "更新評價",
    submittingReview: "送出中...",
    loginToReview: "登入後購買此課程即可留下評價",
    purchaseToReview: "購買此課程後即可留下評價",
    anonymous: "匿名用戶",
    ratingLabel: "評分：",
    includesVideos: "支高畫質教學影片",
    includesPdf: "專屬學員課表講義 (PDF)",
    includesUnlimited: "無限次數觀看權限",
    includesCommunity: "專屬學員社群",
    learnItem1: "建立正確的訓練觀念",
    learnItem2: "學習安全有效的動作技巧",
    learnItem3: "了解肌肉生長原理",
    learnItem4: "制定個人化訓練計畫",
    learnItem5: "掌握營養補充要點",
    learnItem6: "避免常見訓練錯誤",
  },
  videos: {
    pageLabel: "Reels",
    heading: "Reels",
    subheading: "短影音精選 — 隨手翻、隨時看",
    noVideos: "目前沒有影片",
    searchPlaceholder: "搜尋影片...",
    noSearchResults: "找不到符合的影片",
    clearSearch: "清除搜尋",
    totalCount: "部影片",
    pageInfo: "頁",
    filterTraining: "訓練",
    filterNutrition: "營養",
    filterLifestyle: "生活",
  },
  contact: {
    pageLabel: "Contact",
    heading: "聯絡阿倫教官",
    subtitle: "想提升教練業績？100天月入8萬起，免費 40 分鐘 1 對 1 諮詢",
    formSection: "傳送訊息",
    infoSection: "聯絡方式",
    socialSection: "社群媒體",
    lineQuickContact: "LINE 官方帳號（最快回覆）",
    email: "Email",
    businessHours: "營業時間",
    formName: "姓名",
    formEmail: "電子郵件",
    formPhone: "電話（選填）",
    formSubject: "主旨",
    formMessage: "訊息內容",
    formSubmit: "📩 送出訊息",
    formNote: "送出後將由 Email 通知阿倫教官，通常 24 小時內回覆",
    formSuccess: "訊息已送出！阿倫教官會盡快回覆您 📩",
    namePlaceholder: "請輸入您的姓名",
    emailPlaceholder: "請輸入您的電子郵件",
    phonePlaceholder: "例如：0912-345-678",
    subjectPlaceholder: "例如：想了解教練培訓課程",
    messagePlaceholder: "請描述您的需求或問題，我們會盡快回覆您...",
  },
  member: {
    pageLabel: "Member Center",
    heading: "會員中心",
    welcome: "歡迎回來",
    purchasedCourses: "已購課程",
    completedLessons: "完成課堂",
    studyDays: "學習天數",
    personalInfo: "個人資料",
    myCourses: "我的課程",
    accountSettings: "帳號設定",
    noCourses: "尚無已購課程",
    displayName: "顯示名稱",
    phone: "電話",
    gender: "性別",
    male: "男",
    female: "女",
    other: "其他",
    saveChanges: "儲存變更",
    saving: "儲存中...",
    uploadAvatar: "上傳頭像",
    currentPassword: "目前密碼",
    newPassword: "新密碼",
    confirmPassword: "確認新密碼",
    changePassword: "變更密碼",
    browseCourses: "瀏覽課程",
    changeAvatar: "更換頭貼",
    selectAvatar: "選擇頭像",
    removeAvatar: "移除頭像",
    updateProfile: "更新資料",
    updating: "更新中…",
    member: "會員",
    profileUpdateSuccess: "個人資料更新成功！",
    avatarUpdateSuccess: "頭像更新成功！",
    avatarUpdateFailed: "頭像上傳失敗，請稍後再試",
    avatarRemoved: "頭像已移除",
    avatarDeleteFailed: "刪除頭像失敗",
    displayNameEmpty: "顯示名稱不可為空",
    displayNameTooLong: "顯示名稱不可超過 30 字元",
    displayNameInvalid: "顯示名稱包含不允許的字元",
    displayNameCharset: "顯示名稱只能包含中英文、數字、空格和常見標點",
  },
  login: {
    heading: "歡迎回來",
    subtitle: "登入你的帳號",
    email: "電子郵件",
    password: "密碼",
    forgotPassword: "忘記密碼？",
    submit: "登入",
    submitting: "登入中...",
    noAccount: "還沒有帳號？",
    registerNow: "立即註冊",
    orContinueWith: "或使用",
  },
  register: {
    heading: "建立帳號",
    subtitle: "加入阿倫教官平台",
    username: "使用者名稱",
    name: "姓名",
    email: "電子郵件",
    displayName: "顯示名稱（選填）",
    phone: "電話（選填）",
    password: "密碼",
    passwordPlaceholder: "請輸入密碼 (至少 6 個字元)",
    confirmPassword: "確認密碼",
    submit: "建立帳號",
    submitting: "建立中...",
    hasAccount: "已有帳號？",
    loginNow: "立即登入",
    terms: "建立帳號即表示同意服務條款",
    orWith: "或使用以下方式註冊",
    passwordMismatch: "密碼確認不一致",
    passwordTooShort: "密碼長度至少需要 6 個字元",
    successMsg: "註冊成功！即將跳轉至登入頁面...",
  },
  checkout: {
    heading: "確認購買",
    orderSummary: "訂單摘要",
    total: "合計",
    proceedToPayment: "前往付款",
    backToCourse: "返回課程",
    paymentMethod: "付款方式",
  },
  admin: {
    dashboard: "儀表板",
    users: "用戶管理",
    courses: "課程管理",
    articles: "文章管理",
    videos: "Reels",
    lessons: "教學影片",
    whitelist: "白名單管理",
    landingPages: "自訂頁面",
    newArticle: "新增文章",
    newCourse: "新增課程",
    saveDraft: "儲存草稿",
    publish: "發布",
    manageCategories: "管理分類",
    export: "匯出中心",
  },
  exportFeature: {
    exportData: "匯出資料",
    exportMyChats: "匯出我的對話",
    exportFormat: "匯出格式",
    exporting: "匯出中...",
    exportSuccess: "匯出成功",
    exportFailed: "匯出失敗，請稍後再試",
    exportConversation: "匯出此對話",
    noConversations: "目前沒有任何對話記錄",
    messageCount: "則訊息",
    exportCenter: "匯出中心",
    moduleExport: "分模組匯出",
    fullExport: "全站資料匯出",
    fullExportDesc: "將所有模組資料匯出為一份 Excel 檔案（各模組各一個工作表），不含使用者密碼。",
    fullExportBtn: "下載全站 Excel",
    selectFormat: "選擇格式",
    formatMd: "Markdown (.md)",
    formatTxt: "純文字 (.txt)",
    formatHtml: "網頁 (.html)",
    formatXlsx: "Excel (.xlsx)",
    formatDocx: "Word (.docx)",
  },
};

/** 英文翻譯 */
const en: Translations = {
  nav: {
    home: "About Coach",
    courses: "Courses",
    videos: "Reels",
    lessons: "Lessons",
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
    views: "views",
    noData: "No data available",
    page: "Page",
    of: "of",
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
    pageLabel: "Knowledge",
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
    popularArticles: "Popular Articles",
    submitReply: "Submit Reply",
  },
  course: {
    title: "Course",
    list: "Courses",
    detail: "Course Detail",
    pageLabel: "Online Courses",
    price: "Price",
    duration: "Duration",
    level: "Level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    allLevels: "All Levels",
    enroll: "Enroll Now",
    free: "Free",
    lessons: "lessons",
    reviews: "reviews",
    rating: "Rating",
    enrolled: "Enrolled",
    accessDays: "day access",
    noCourses: "No courses found",
    backToList: "Back to Courses",
    loginToEnroll: "Login to enroll",
    alreadyOwned: "Already Owned",
    addToCart: "Add to Cart",
    showPrice: "View Price",
    noReviews: "No reviews yet",
    viewDetail: "View Details",
    allCategories: "All Categories",
    noFilterMatch: "No courses match your filters",
    clearFilters: "Clear Filters",
    inquirePrice: "Contact for Price",
    ctaTitle: "Need a Custom Training Plan?",
    ctaSubtitle: "We offer 1-on-1 consultations to create a personalized training program tailored to your goals",
    ctaBook: "Book Consultation",
    intro: "Course Overview",
    courseContent: "Course Content",
    whatYouLearn: "What You'll Learn",
    studentReviews: "Student Reviews",
    buyNow: "Buy Now",
    loginToBuy: "Login to Buy",
    rateThis: "Rate this course",
    updateReview: "Update your review",
    submitReview: "Submit Review",
    updateReviewBtn: "Update Review",
    submittingReview: "Submitting...",
    loginToReview: "Login and purchase this course to leave a review",
    purchaseToReview: "Purchase this course to leave a review",
    anonymous: "Anonymous",
    ratingLabel: "Rating:",
    includesVideos: "HD tutorial videos",
    includesPdf: "Student course handout (PDF)",
    includesUnlimited: "Unlimited viewing access",
    includesCommunity: "Exclusive student community",
    learnItem1: "Build the right training mindset",
    learnItem2: "Learn safe and effective movement techniques",
    learnItem3: "Understand the principles of muscle growth",
    learnItem4: "Create a personalized training plan",
    learnItem5: "Master key nutrition supplementation tips",
    learnItem6: "Avoid common training mistakes",
  },
  videos: {
    pageLabel: "Reels",
    heading: "Reels",
    subheading: "A scroll of bite-sized fitness clips",
    noVideos: "No videos available",
    searchPlaceholder: "Search videos...",
    noSearchResults: "No matching videos found",
    clearSearch: "Clear Search",
    totalCount: "videos",
    pageInfo: "page",
    filterTraining: "Training",
    filterNutrition: "Nutrition",
    filterLifestyle: "Lifestyle",
  },
  contact: {
    pageLabel: "Contact",
    heading: "Contact Coach Aaron",
    subtitle: "Want to grow your coaching income? Free 40-min 1-on-1 consultation",
    formSection: "Send a Message",
    infoSection: "Contact Info",
    socialSection: "Social Media",
    lineQuickContact: "LINE Official Account (Fastest Reply)",
    email: "Email",
    businessHours: "Business Hours",
    formName: "Name",
    formEmail: "Email",
    formPhone: "Phone (Optional)",
    formSubject: "Subject",
    formMessage: "Message",
    formSubmit: "📩 Send Message",
    formNote: "Coach Aaron will be notified via email and usually replies within 24 hours.",
    formSuccess: "Message sent! Coach Aaron will get back to you soon 📩",
    namePlaceholder: "Your name",
    emailPlaceholder: "Your email address",
    phonePlaceholder: "e.g. +886-912-345-678",
    subjectPlaceholder: "e.g. Interested in coaching program",
    messagePlaceholder: "Describe your needs or questions and we'll get back to you...",
  },
  member: {
    pageLabel: "Member Center",
    heading: "Member Center",
    welcome: "Welcome back",
    purchasedCourses: "Purchased Courses",
    completedLessons: "Completed Lessons",
    studyDays: "Study Days",
    personalInfo: "Personal Info",
    myCourses: "My Courses",
    accountSettings: "Account Settings",
    noCourses: "No purchased courses yet",
    displayName: "Display Name",
    phone: "Phone",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    saveChanges: "Save Changes",
    saving: "Saving...",
    uploadAvatar: "Upload Avatar",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    changePassword: "Change Password",
    browseCourses: "Browse Courses",
    changeAvatar: "Change Avatar",
    selectAvatar: "Select Avatar",
    removeAvatar: "Remove Avatar",
    updateProfile: "Update Profile",
    updating: "Updating…",
    member: "Member",
    profileUpdateSuccess: "Profile updated successfully!",
    avatarUpdateSuccess: "Avatar updated successfully!",
    avatarUpdateFailed: "Avatar upload failed, please try again",
    avatarRemoved: "Avatar removed",
    avatarDeleteFailed: "Failed to delete avatar",
    displayNameEmpty: "Display name cannot be empty",
    displayNameTooLong: "Display name cannot exceed 30 characters",
    displayNameInvalid: "Display name contains invalid characters",
    displayNameCharset: "Display name can only contain letters, numbers, spaces and common punctuation",
  },
  login: {
    heading: "Welcome Back",
    subtitle: "Sign in to your account",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    submit: "Login",
    submitting: "Signing in...",
    noAccount: "Don't have an account?",
    registerNow: "Register now",
    orContinueWith: "Or continue with",
  },
  register: {
    heading: "Create Account",
    subtitle: "Join Coach Aaron's Platform",
    username: "Username",
    name: "Name",
    email: "Email",
    displayName: "Display Name (Optional)",
    phone: "Phone (Optional)",
    password: "Password",
    passwordPlaceholder: "Password (at least 6 characters)",
    confirmPassword: "Confirm Password",
    submit: "Create Account",
    submitting: "Creating...",
    hasAccount: "Already have an account?",
    loginNow: "Login now",
    terms: "By creating an account you agree to the Terms of Service",
    orWith: "Or register with",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    successMsg: "Registration successful! Redirecting to login...",
  },
  checkout: {
    heading: "Confirm Purchase",
    orderSummary: "Order Summary",
    total: "Total",
    proceedToPayment: "Proceed to Payment",
    backToCourse: "Back to Course",
    paymentMethod: "Payment Method",
  },
  admin: {
    dashboard: "Dashboard",
    users: "Users",
    courses: "Courses",
    articles: "Articles",
    videos: "Reels",
    lessons: "Lessons",
    whitelist: "Whitelist",
    landingPages: "Landing Pages",
    newArticle: "New Article",
    newCourse: "New Course",
    saveDraft: "Save Draft",
    publish: "Publish",
    manageCategories: "Manage Categories",
    export: "Export Center",
  },
  exportFeature: {
    exportData: "Export Data",
    exportMyChats: "Export My Chats",
    exportFormat: "Export Format",
    exporting: "Exporting...",
    exportSuccess: "Export Successful",
    exportFailed: "Export failed, please try again",
    exportConversation: "Export This Conversation",
    noConversations: "No conversations found",
    messageCount: "messages",
    exportCenter: "Export Center",
    moduleExport: "Export by Module",
    fullExport: "Full Site Export",
    fullExportDesc: "Export all modules into a single Excel file (one sheet per module). User passwords are excluded.",
    fullExportBtn: "Download Full Site Excel",
    selectFormat: "Select Format",
    formatMd: "Markdown (.md)",
    formatTxt: "Plain Text (.txt)",
    formatHtml: "Webpage (.html)",
    formatXlsx: "Excel (.xlsx)",
    formatDocx: "Word (.docx)",
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
