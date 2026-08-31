/**
 * 會員區與共用 UI 補充翻譯（會員中心、預約、聊天、通知、共用元件）
 * @module locales/memberExtra
 *
 * 分檔規則同 publicExtra.ts —— 只放會員區/共用 UI 的 namespace。
 *
 * 插值：字典值裡的 `{name}` 由呼叫端用 `.replace("{name}", value)` 帶入，
 * 全站沒有 i18n 函式庫，這是既有的最小慣例。
 */

/** 與 services/booking 的 BookingStatus、ui/feedback/StatusBadge 的 StatusType 對應。
 *  刻意在這裡就地宣告（不 import），避免字典檔與元件／服務層產生環狀相依。 */
type BookingStatusKey =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";
type StatusBadgeKey =
  | "draft"
  | "published"
  | "archived"
  | "active"
  | "inactive"
  | "pending";

/** 會員區/共用 UI 補充翻譯的形狀（zh 與 en 必須同構） */
export interface MemberExtraTranslations {
  /** 相對時間詞（聊天、通知、反饋共用） */
  dateTime: {
    today: string;
    yesterday: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
  /** 會員儀表板 /dashboard */
  dashboard: {
    seoTitle: string;
    welcome: string;
    guestName: string;
    subtitle: string;
    statWeeklyProgress: string;
    statCompletedLessons: string;
    statTotalMinutes: string;
    statStreakDays: string;
    continueLearning: string;
    demoCourse1: string;
    demoCourse2: string;
    today: string;
    yesterday: string;
    lastStudied: string;
    noCoursesStarted: string;
    quickActions: string;
    actionWatchVideos: string;
    actionContactCoach: string;
  };
  /** 會員中心 /member（核心字典 member.* 之外的補充） */
  memberCenter: {
    seoTitle: string;
    welcomeLine: string;
    downloadFailed: string;
    chatFilePrefix: string;
  };
  /** 預約狀態（services/booking 的 BOOKING_STATUS_LABEL 只有中文，改走字典） */
  bookingStatus: Record<BookingStatusKey, string>;
  /** 預約頁 /booking */
  bookingPage: {
    loadFailed: string;
    coachUnavailable: string;
    heading: string;
    meta: string;
    calendarHint: string;
    /** date-fns 的 format 樣板，中英文日期寫法不同 */
    dayHeadingFormat: string;
    slotsForDay: string;
    pickDayFirst: string;
    noSlotsThatDay: string;
    viewMyBookingsPrefix: string;
    submitTitle: string;
    submitting: string;
    slotLabel: string;
    durationLabel: string;
    courseLabel: string;
    courseNone: string;
    noteLabel: string;
    notePlaceholder: string;
    contactEmailLabel: string;
    contactEmailPlaceholder: string;
    contactPhoneLabel: string;
    contactRequired: string;
    contactHint: string;
    submitSuccessTitle: string;
    submitSuccessMessage: string;
    submitFailed: string;
  };
  /** 我的預約 /my-bookings */
  myBookings: {
    heading: string;
    subtitle: string;
    newBooking: string;
    loadFailed: string;
    empty: string;
    emptyCta: string;
    relatedCourse: string;
    coachNote: string;
    submittedAt: string;
    cancelTitle: string;
    cancelMessage: string;
    cancelFailed: string;
  };
  /** 通知中心 /notifications */
  notificationsPage: {
    heading: string;
    subtitle: string;
    markAllRead: string;
    pushHeading: string;
    pushUnsupported: string;
    pushOn: string;
    pushOff: string;
    pushBusy: string;
    pushEnable: string;
    pushDisable: string;
    toggleFailed: string;
    unread: string;
    emptyUnread: string;
    emptyAll: string;
    backHome: string;
  };
  /** 聊天 /chat 與 components/chat/ */
  chatUi: {
    messages: string;
    newChat: string;
    pickConversation: string;
    orStartNew: string;
    conversationMissing: string;
    noConversations: string;
    noConversationsHint: string;
    startNewChat: string;
    left: string;
    noMessagesYet: string;
    noMessagesGreeting: string;
    leftGroupNotice: string;
    memberCount: string;
    viewMembers: string;
    close: string;
    /** chat.service 的中文 fallback 對應 */
    groupFallback: string;
    conversationFallback: string;
    userFallback: string;
    imagePreview: string;
    /** presence.service 的中文「最後上線」對應 */
    lastSeenNever: string;
    lastSeenOnline: string;
    lastSeenMinutes: string;
    lastSeenHours: string;
    lastSeenYesterday: string;
    lastSeenDays: string;
    /** 輸入區 */
    imageTypeError: string;
    imageTooLarge: string;
    sendFailedRestored: string;
    previewAlt: string;
    removeImage: string;
    attachImage: string;
    inputPlaceholder: string;
    attachedImageAlt: string;
    /** 群組成員 modal */
    membersTitle: string;
    addMember: string;
    done: string;
    searchMemberPlaceholder: string;
    noMemberFound: string;
    searchPrompt: string;
    addAction: string;
    you: string;
    yourself: string;
    adminTag: string;
    ownerTag: string;
    leave: string;
    remove: string;
    leaveGroupTitle: string;
    leaveGroupMessage: string;
    removeMemberTitle: string;
    removeMemberMessage: string;
    actionFailed: string;
    addFailed: string;
    tryAgainLater: string;
    /** 開新對話 modal */
    newChatTitle: string;
    tabDm: string;
    tabGroup: string;
    adminsAndCoaches: string;
    tapToToggle: string;
    otherMembers: string;
    comboboxPlaceholder: string;
    searching: string;
    noOtherMembers: string;
    searchOtherMembers: string;
    groupNameLabel: string;
    groupNamePlaceholder: string;
    selectedCount: string;
    searchAndAddPlaceholder: string;
    creating: string;
    createGroupBtn: string;
    groupNameRequired: string;
    pickAtLeastOne: string;
    openChatFailed: string;
    createGroupFailed: string;
  };
  /** 結帳頁 /checkout（核心字典 checkout.* 之外的補充） */
  checkoutPage: {
    seoTitle: string;
    seoDescription: string;
    heading: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    choosePayment: string;
    comingSoon: string;
    payLinePayDesc: string;
    payNewebPayName: string;
    payNewebPayDesc: string;
    payEcPayName: string;
    payEcPayDesc: string;
    payJkoPayName: string;
    payJkoPayDesc: string;
    payApplePayDesc: string;
    payGooglePayDesc: string;
    plan3mTitle: string;
    plan3mDuration: string;
    plan3mDesc: string;
    plan6mTitle: string;
    plan6mDuration: string;
    plan6mDesc: string;
    plan1yTitle: string;
    plan1yDuration: string;
    plan1yDesc: string;
    orderNoteLabel: string;
    orderNotePlaceholder: string;
    planDuration: string;
    planFee: string;
    bonusCourses: string;
    includedInPlan: string;
    amountDue: string;
    processing: string;
    confirmPayment: string;
    loginToPurchase: string;
    registerNewAccount: string;
    sslNotice: string;
    backToCourses: string;
    loginRequiredTitle: string;
    loginModalHeading: string;
    loginModalBody: string;
    loginNow: string;
    selectPaymentError: string;
    checkoutFailed: string;
    redirectTitle: string;
    redirectMessage: string;
    mobilePayTitle: string;
    mobilePayMessage: string;
  };
  /** 結帳成功頁 /checkout/success */
  checkoutSuccess: {
    seoTitle: string;
    seoDescription: string;
    heading: string;
    subtitle: string;
    orderNumber: string;
    orderStatus: string;
    paid: string;
    orderTime: string;
    nextStepsTitle: string;
    step1: string;
    step2: string;
    step3: string;
    goToMemberCenter: string;
    backHome: string;
    anyQuestions: string;
    contactUs: string;
  };
  /** 教練儀表板 /coach */
  coachDash: {
    heading: string;
    subtitle: string;
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    tabPending: string;
    tabAll: string;
    tabSchedule: string;
    tabGoogle: string;
    noPending: string;
    noBookings: string;
    anonymous: string;
    syncedWithGoogle: string;
    noteLabel: string;
    failedTitle: string;
    approveFailed: string;
    rejectFailed: string;
    saveFailed: string;
    addTimeOffFailed: string;
    cancelBookingMessage: string;
    deleteRuleTitle: string;
    deleteTimeOffTitle: string;
    thisTimeOff: string;
    basicSettings: string;
    slotMinutes: string;
    noticeHours: string;
    windowDays: string;
    cancellationHours: string;
    bookingOpen: string;
    bookingPaused: string;
    autoSaveHint: string;
    weeklySlots: string;
    addRule: string;
    noRules: string;
    timeOff: string;
    addTimeOff: string;
    noTimeOff: string;
    googleSyncTitle: string;
    googleSyncDesc: string;
    statusLabel: string;
    googleConnected: string;
    googleTokenExpired: string;
    googleNotConnected: string;
    connectGoogle: string;
    reconnect: string;
    disconnect: string;
    googleMsgConnected: string;
    googleMsgDenied: string;
    googleMsgNoCode: string;
    googleMsgBadState: string;
    googleMsgNoRefresh: string;
    googleMsgError: string;
    reviewTitle: string;
    userLabel: string;
    contactLabel: string;
    reviewNoteLabel: string;
    reviewNotePlaceholder: string;
    reject: string;
    approveAndSync: string;
    editRuleTitle: string;
    newRuleTitle: string;
    weekdayLabel: string;
    startLabel: string;
    endLabel: string;
    addTimeOffTitle: string;
    startTimeLabel: string;
    endTimeLabel: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    tapToReview: string;
  };
  /** ImageInput（全站圖片欄位） */
  imageInput: {
    sourceTablist: string;
    tabUpload: string;
    tabUrl: string;
    previewFailed: string;
    previewAlt: string;
    previewAltLabeled: string;
    uploading: string;
    dropToReplace: string;
    replace: string;
    cancelReplace: string;
    remove: string;
    uploaded: string;
    dropzoneHint: string;
    dropzoneClick: string;
    dropzoneMeta: string;
    apply: string;
    requiredField: string;
    legacyUrlWarning: string;
    errUnsupportedType: string;
    errTooLarge: string;
    errUploadFailed: string;
    errUrlSource: string;
    errUrlSourceExtra: string;
  };
  /** 頭像裁切 / 選擇器 */
  avatarUi: {
    cropHint: string;
    processing: string;
    confirmCrop: string;
    tabUpload: string;
    tabDicebear: string;
    tabBoring: string;
    chooseImage: string;
    uploadHint: string;
    randomize: string;
    randomStyle: string;
    useThisAvatar: string;
    styleAdventurer: string;
    styleBottts: string;
    styleFunEmoji: string;
    styleNotionists: string;
    stylePixelArt: string;
    styleThumbs: string;
    boringBeam: string;
    boringMarble: string;
    boringPixel: string;
    boringSunset: string;
    boringRing: string;
    boringBauhaus: string;
  };
  /** 富文本編輯器 RichTextEditor */
  richEditor: {
    placeholder: string;
    sizeSmall: string;
    sizeMedium: string;
    sizeLarge: string;
    sizeFull: string;
    sizeXLarge: string;
    errNoDrop: string;
    errNoPaste: string;
    errImageSourceLegacy: string;
    errNeedImage: string;
    errImageSourceInvalid: string;
    errNeedVideoUrl: string;
    errYoutubeOnly: string;
    errNeedLinkUrl: string;
    defaultAlt: string;
    toolBold: string;
    toolItalic: string;
    toolUnderline: string;
    toolStrike: string;
    toolH1: string;
    toolH2: string;
    toolH3: string;
    toolBullet: string;
    toolOrdered: string;
    toolAlignLeft: string;
    toolAlignCenter: string;
    toolAlignRight: string;
    toolInsertImage: string;
    toolInsertVideo: string;
    toolInsertLink: string;
    toolQuote: string;
    toolCode: string;
    usageHint: string;
    adjustImageSize: string;
    adjustVideoSize: string;
    current: string;
    currentSize: string;
    insertImageTitle: string;
    imageLabel: string;
    altTextLabel: string;
    altTextPlaceholder: string;
    sizeLabel: string;
    alignLabel: string;
    alignLeftWrap: string;
    alignCenter: string;
    alignRightWrap: string;
    insertVideoTitle: string;
    insertVideoBtn: string;
    importantNotice: string;
    youtubeOnlyNotice: string;
    youtubeUrlLabel: string;
    videoSizeLabel: string;
    insertLinkTitle: string;
    linkUrlLabel: string;
    linkTextLabel: string;
    linkTextPlaceholder: string;
  };
  /** 圖片庫節點 components/editor/ImageGallery */
  imageGallery: {
    title: string;
    removeThisImage: string;
    emptyHint: string;
  };
  /** 自由排版區塊編輯器 */
  blockEditor: {
    errNeedImageUrl: string;
    errImageSource: string;
    errNeedYoutubeUrl: string;
    errYoutubeOnly: string;
    spacer: string;
    addBlock: string;
    blockText: string;
    blockImage: string;
    blockVideo: string;
    blockDivider: string;
    blockSpacer: string;
    undo: string;
    redo: string;
    showGrid: string;
    properties: string;
    position: string;
    size: string;
    width: string;
    height: string;
    rotation: string;
    fontSize: string;
    bgColor: string;
    textWrap: string;
    none: string;
    wrapLeft: string;
    wrapRight: string;
    borderRadius: string;
    objectFit: string;
    fitCover: string;
    fitContain: string;
    fitFill: string;
    alignLeft: string;
    alignRight: string;
    duplicate: string;
    bringToFront: string;
    sendToBack: string;
    lock: string;
    unlock: string;
    deleteBlock: string;
    addImageTitle: string;
    cloudinaryNotice: string;
    addVideoTitle: string;
    youtubeOnlyNotice: string;
    imageLoadFailed: string;
    invalidYoutubeUrl: string;
    doubleClickToEdit: string;
    seedText: string;
  };
  /** 全站搜尋 */
  globalSearch: {
    placeholder: string;
    promptTitle: string;
    promptHint: string;
    noResults: string;
    noResultsHint: string;
    typeComment: string;
    typeReview: string;
    hintNavigate: string;
    hintSelect: string;
    triggerTitle: string;
  };
  /** 悄悄話表單 */
  whisperForm: {
    heading: string;
    intro: string;
    nameLabel: string;
    namePlaceholder: string;
    contactLabel: string;
    contactNote: string;
    contactPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    footer: string;
    nameLength: string;
    contactRequired: string;
    contactInvalid: string;
    messageLength: string;
    sent: string;
    sendFailed: string;
    networkError: string;
  };
  /** DataTable */
  dataTable: {
    sortLabel: string;
    sortDefault: string;
  };
  /** StatusBadge 狀態文字 */
  statusBadge: Record<StatusBadgeKey, string>;
  /** 表單共用元件（SearchInput / TagInput / Toggle） */
  formUi: {
    searchPlaceholder: string;
    toggleOn: string;
    toggleOff: string;
    tagInputPlaceholder: string;
    tagExists: string;
    tagMax: string;
    tagInvalid: string;
    tagCount: string;
    removeTag: string;
  };
  /** 輪播 / 見證元件的 aria-label 與提示 */
  carouselUi: {
    clickHint: string;
    nextItem: string;
    prevSlide: string;
    nextSlide: string;
    goToSlide: string;
    expand: string;
    prevBatch: string;
    nextBatch: string;
  };
  /** 其他共用小元件 */
  uiCommon: {
    goTo: string;
    notifications: string;
    insertImage: string;
    insert: string;
    invalidUrl: string;
    inputRequired: string;
    errorTitle: string;
    unknownError: string;
    reload: string;
  };
  /** 意見反饋 /feedback（學員視角）*/
  memberFeedback: {
    seoTitle: string;
    heading: string;
    subtitle: string;
    newFeedback: string;
    searchPlaceholder: string;
    loadFailed: string;
    empty: string;
    emptyHint: string;
    emptySearch: string;
    backToList: string;
    messagesCount: string;
    lastUpdated: string;
    waitingCoach: string;
    yourTurn: string;
    statusLabel: {
      waiting_member: string;
      waiting_coach: string;
      in_progress: string;
      resolved: string;
    };
    modal: {
      title: string;
      titleLabel: string;
      titlePlaceholder: string;
      contentLabel: string;
      contentPlaceholder: string;
      attachLabel: string;
      submit: string;
      submitting: string;
      cancel: string;
    };
    attach: {
      dropHint: string;
      remaining: string;
      tooMany: string;
      tooLarge: string;
      badType: string;
      removeAria: string;
    };
    reply: {
      placeholder: string;
      send: string;
      sending: string;
    };
    conversation: {
      roleMember: string;
      roleCoach: string;
      edited: string;
      edit: string;
      delete: string;
      save: string;
      cancel: string;
    };
    deleteMsgTitle: string;
    deleteMsgMessage: string;
    validation: {
      titleRequired: string;
      contentRequired: string;
    };
    errors: {
      createFailed: string;
      replyFailed: string;
      editFailed: string;
      deleteFailed: string;
    };
  };
  /**
   * 客戶筆記本（`/notes` 與 `/admin/notes` 共用）。
   *
   * 收在 memberExtra 而不是 adminExtra，是因為 `components/notes/*` 是
   * **兩邊共用的元件**：教練與客戶看到的是同一套樹與同一顆編輯器，
   * 只有角色（owner / client）不同。字典若拆兩份，共用元件就得跨 namespace
   * 取字，改一邊必忘另一邊。adminExtra 只留 admin 專屬的頁面外框文案。
   */
  notes: {
    /** 會員頁 `<title>`（noindex，純粹給瀏覽器分頁看） */
    seoTitle: string;
    heading: string;
    subtitle: string;
    loadFailed: string;
    retry: string;
    /** 039 migration 未貼時的「尚未啟用」畫面 */
    unavailableTitle: string;
    unavailableBody: string;
    listEmptyOwner: string;
    listEmptyClient: string;
    cardCourse: string;
    cardClient: string;
    cardUpdated: string;
    /** owner 專屬：建立筆記本彈窗 */
    create: {
      button: string;
      title: string;
      clientLabel: string;
      clientSearch: string;
      clientEmpty: string;
      courseLabel: string;
      coursePlaceholder: string;
      titleLabel: string;
      titlePlaceholder: string;
      grantLabel: string;
      grantHint: string;
      submit: string;
      submitting: string;
      errRequired: string;
      errFailed: string;
    };
    /** owner 專屬：刪除整本筆記本 */
    del: {
      button: string;
      confirmTitle: string;
      /** 插值 `{name}` = 筆記本標題 */
      confirmMessage: string;
      confirmText: string;
      failed: string;
    };
    backToList: string;
    pagesHeading: string;
    openTree: string;
    closeTree: string;
    noSelection: string;
    treeEmpty: string;
    untitled: string;
    expand: string;
    collapse: string;
    addChild: string;
    addChildFailed: string;
    rename: string;
    renameTitle: string;
    renameMessage: string;
    renameFailed: string;
    moveTo: string;
    moveTitle: string;
    /** 插值 `{name}` = 被搬移的頁標題 */
    moveHint: string;
    moveCurrentParent: string;
    moveNoTarget: string;
    moveFailed: string;
    deletePage: string;
    deleteTitle: string;
    /** 插值 `{name}` = 頁標題 */
    deleteMessage: string;
    deleteConfirm: string;
    deleteFailed: string;
    titlePlaceholder: string;
    editorLoading: string;
    /** 自動儲存狀態指示燈 */
    saveDirty: string;
    saving: string;
    saved: string;
    saveFailed: string;
    saveConflict: string;
    /** 樂觀鎖撞寫（對方先存了）的橫幅 */
    conflictBody: string;
    conflictReload: string;
    dbAddCard: string;
    dbEmpty: string;
    typePage: string;
    typeDatabase: string;
    /** root database 頁的分類看板（欄＝分類、卡＝子頁） */
    board: {
      /** 最後一欄：category_id 為 null 或懸空的卡片都在這 */
      uncategorized: string;
      addCard: string;
      columnEmpty: string;
      manageCategories: string;
      dragHint: string;
      /** 手機沒有 HTML5 拖曳，改指路到卡片的「⋯」選單 */
      dragHintMobile: string;
      /** 卡片「⋯」選單（手機取代拖曳） */
      moveTo: string;
      /** 插值 `{name}` = 卡片標題 */
      moveHint: string;
      moveFailed: string;
      updatedAt: string;
    };
    /** 分類管理彈窗 */
    cat: {
      title: string;
      hint: string;
      namePlaceholder: string;
      unnamed: string;
      add: string;
      color: string;
      moveLeft: string;
      moveRight: string;
      remove: string;
      removeConfirmTitle: string;
      /** 插值 `{name}` = 分類名稱；務必講明卡片會歸入未分類 */
      removeConfirmMessage: string;
      removeConfirmText: string;
      save: string;
      saving: string;
      cancel: string;
      empty: string;
      nameRequired: string;
      saveFailed: string;
      limitReached: string;
    };
    /** 編輯器 slash 選單的筆記本自訂項 */
    slash: {
      group: string;
      subPageTitle: string;
      subPageSubtext: string;
      databaseTitle: string;
      databaseSubtext: string;
    };
    /** 內文裡的頁面連結卡片（自訂 pageLink block） */
    pageLink: {
      open: string;
      deleted: string;
      badgeDatabase: string;
    };
  };
}

const zhTW: MemberExtraTranslations = {
  dateTime: {
    today: "今天",
    yesterday: "昨天",
    justNow: "剛剛",
    minutesAgo: "{n} 分鐘前",
    hoursAgo: "{n} 小時前",
    daysAgo: "{n} 天前",
  },
  dashboard: {
    seoTitle: "會員儀表板 | 阿倫教官",
    welcome: "歡迎回來，{name}",
    guestName: "學員",
    subtitle: "繼續您的健身之旅",
    statWeeklyProgress: "本週進度",
    statCompletedLessons: "完成課堂",
    statTotalMinutes: "累計分鐘",
    statStreakDays: "連續天數",
    continueLearning: "繼續學習",
    demoCourse1: "初學者健身入門",
    demoCourse2: "增肌實戰計畫",
    today: "今天",
    yesterday: "昨天",
    lastStudied: "{when}學習",
    noCoursesStarted: "尚未開始任何課程",
    quickActions: "快速操作",
    actionWatchVideos: "觀看影片",
    actionContactCoach: "聯絡教練",
  },
  memberCenter: {
    seoTitle: "會員中心 | 阿倫教官",
    welcomeLine: "歡迎回來，{name}",
    downloadFailed: "下載失敗",
    chatFilePrefix: "對話",
  },
  bookingStatus: {
    pending: "等待教練確認",
    confirmed: "已確認",
    rejected: "已拒絕",
    cancelled: "已取消",
    completed: "已完成",
  },
  bookingPage: {
    loadFailed: "載入諮詢時段失敗",
    coachUnavailable: "教練目前未開放預約",
    heading: "預約 {coach} 的諮詢時間",
    meta: "每次諮詢 {minutes} 分鐘 · 時區 {timezone} · 最短 {noticeHours} 小時前預約 · 最長 {windowDays} 天內",
    calendarHint: "🟢 亮色日期有可預約時段，點擊選擇日期",
    dayHeadingFormat: "yyyy 年 MM 月 dd 日",
    slotsForDay: "{date} 可預約時段",
    pickDayFirst: "請先在左側選日期",
    noSlotsThatDay: "該日無可預約時段",
    viewMyBookingsPrefix: "想看自己的預約紀錄？前往",
    submitTitle: "送出預約",
    submitting: "送出中...",
    slotLabel: "時段：",
    durationLabel: "時長 {minutes} 分鐘",
    courseLabel: "想諮詢的課程（選填）",
    courseNone: "不指定",
    noteLabel: "想聊什麼？（選填）",
    notePlaceholder: "例：想了解 XX 課程內容、有 OO 問題想討論...",
    contactEmailLabel: "聯絡 Email",
    contactEmailPlaceholder: "預約通知會寄到此信箱",
    contactPhoneLabel: "聯絡電話",
    contactRequired: "請提供 email 或電話至少一項",
    contactHint: "email 與電話至少需填一項。",
    submitSuccessTitle: "送出成功",
    submitSuccessMessage: "已送出預約申請，教練確認後會以 email 通知你。",
    submitFailed: "送出預約失敗，請稍後再試",
  },
  myBookings: {
    heading: "我的預約",
    subtitle: "查看所有已送出的諮詢申請",
    newBooking: "+ 新增預約",
    loadFailed: "載入預約失敗",
    empty: "尚無預約紀錄，",
    emptyCta: "立即預約諮詢",
    relatedCourse: "📚 關聯課程：",
    coachNote: "教練備註：",
    submittedAt: "送出於",
    cancelTitle: "取消預約",
    cancelMessage: "確定要取消 {time} 的預約嗎？",
    cancelFailed: "取消失敗，請聯絡教練",
  },
  notificationsPage: {
    heading: "通知中心",
    subtitle: "7 天內的所有通知；過期會自動清除",
    markAllRead: "全部已讀",
    pushHeading: "📱 瀏覽器推播通知",
    pushUnsupported: "你的瀏覽器不支援推播通知",
    pushOn: "✅ 已開啟，瀏覽器關掉也會收到推播",
    pushOff: "關閉中。開啟後即使瀏覽器關掉，也能收到新訊息 / 預約通知",
    pushBusy: "處理中...",
    pushEnable: "啟用推播",
    pushDisable: "停用",
    toggleFailed: "切換失敗",
    unread: "未讀",
    emptyUnread: "沒有未讀通知",
    emptyAll: "目前沒有通知",
    backHome: "回首頁",
  },
  chatUi: {
    messages: "訊息",
    newChat: "新對話",
    pickConversation: "選擇左側對話開始聊天",
    orStartNew: "或開啟新對話",
    conversationMissing: "對話不存在或已被移除",
    noConversations: "還沒有任何私訊",
    noConversationsHint: "開始第一段對話吧",
    startNewChat: "開啟新對話",
    left: "已離開",
    noMessagesYet: "（尚無訊息）",
    noMessagesGreeting: "尚無訊息，打個招呼吧",
    leftGroupNotice: "🚪 你已離開此群組，無法發送新訊息（仍可瀏覽舊訊息）",
    memberCount: "{count} 位成員",
    viewMembers: "查看成員",
    close: "關閉",
    groupFallback: "群組",
    conversationFallback: "對話",
    userFallback: "用戶",
    imagePreview: "📷 圖片",
    lastSeenNever: "尚未上線",
    lastSeenOnline: "在線中",
    lastSeenMinutes: "{count} 分鐘前在線",
    lastSeenHours: "{count} 小時前在線",
    lastSeenYesterday: "昨天上線",
    lastSeenDays: "{count} 天前在線",
    imageTypeError: "僅支援 jpg/png/webp/gif",
    imageTooLarge: "圖片不可超過 5 MB",
    sendFailedRestored: "送出失敗，已還原內容",
    previewAlt: "預覽",
    removeImage: "移除圖片",
    attachImage: "附加圖片",
    inputPlaceholder: "輸入訊息... (Enter 送出 / Shift+Enter 換行)",
    attachedImageAlt: "附圖",
    membersTitle: "👥 {group} 成員（{count}）",
    addMember: "+ 新增成員",
    done: "完成",
    searchMemberPlaceholder: "輸入名稱 / Email 搜尋...",
    noMemberFound: "找不到符合的會員",
    searchPrompt: "輸入關鍵字搜尋",
    addAction: "+ 加入",
    you: "你",
    yourself: "（你自己）",
    adminTag: "管理員",
    ownerTag: "群主",
    leave: "離開",
    remove: "移除",
    leaveGroupTitle: "離開群組",
    leaveGroupMessage:
      "確定要離開「{group}」嗎？\n離開後仍可看到舊訊息，但無法再發訊息或看到新訊息。",
    removeMemberTitle: "移除成員",
    removeMemberMessage:
      "確定要把 {name} 移出群組嗎？對方仍可看到離開前的訊息，但看不到新訊息。",
    actionFailed: "操作失敗",
    addFailed: "新增失敗",
    tryAgainLater: "請稍後再試",
    newChatTitle: "開啟新對話",
    tabDm: "💬 1 對 1 私訊",
    tabGroup: "👥 建立群組",
    adminsAndCoaches: "網站管理員 / 教練",
    tapToToggle: "（點擊切換選取）",
    otherMembers: "👥 其他會員",
    comboboxPlaceholder: "點擊展開或輸入名稱搜尋...",
    searching: "搜尋中...",
    noOtherMembers: "尚無其他會員",
    searchOtherMembers: "搜尋其他會員...",
    groupNameLabel: "群組名稱",
    groupNamePlaceholder: "例：教練團隊 ・ 學員 A 互動群",
    selectedCount: "已選 {count} 位：",
    searchAndAddPlaceholder: "輸入會員名稱搜尋並加入...",
    creating: "建立中...",
    createGroupBtn: "建立群組（{count} 人）",
    groupNameRequired: "請輸入群組名稱",
    pickAtLeastOne: "請至少選擇一位成員",
    openChatFailed: "開啟對話失敗",
    createGroupFailed: "建立群組失敗",
  },
  checkoutPage: {
    seoTitle: "結帳 - {plan}",
    seoDescription: "安全快速的結帳流程，支援多種支付方式",
    heading: "確認訂單",
    subtitle: "請確認您的訂單資訊並選擇支付方式",
    step1: "選擇方案",
    step2: "選擇支付",
    step3: "完成付款",
    choosePayment: "選擇支付方式",
    comingSoon: "即將推出",
    payLinePayDesc: "使用 LINE Pay 快速付款",
    payNewebPayName: "藍新金流",
    payNewebPayDesc: "信用卡、ATM 轉帳、超商代碼",
    payEcPayName: "綠界科技",
    payEcPayDesc: "信用卡、ATM、超商付款",
    payJkoPayName: "街口支付",
    payJkoPayDesc: "使用街口支付掃碼付款",
    payApplePayDesc: "使用 Apple Pay 快速結帳",
    payGooglePayDesc: "使用 Google Pay 快速結帳",
    plan3mTitle: "三個月陪跑方案",
    plan3mDuration: "三個月",
    plan3mDesc: "1對1培訓 12次",
    plan6mTitle: "六個月陪跑方案",
    plan6mDuration: "六個月",
    plan6mDesc: "1對1培訓 24次",
    plan1yTitle: "一年陪跑方案",
    plan1yDuration: "一年",
    plan1yDesc: "1對1培訓 48次",
    orderNoteLabel: "訂單備註（選填）",
    orderNotePlaceholder: "如有特殊需求請在此說明...",
    planDuration: "方案時長：{duration}",
    planFee: "方案費用",
    bonusCourses: "附贈課程",
    includedInPlan: "含在方案內",
    amountDue: "應付金額",
    processing: "處理中...",
    confirmPayment: "確認付款",
    loginToPurchase: "請先登入以完成購買",
    registerNewAccount: "註冊新帳號",
    sslNotice: "SSL 加密安全交易",
    backToCourses: "← 返回課程頁面",
    loginRequiredTitle: "請先登入",
    loginModalHeading: "如要購買課程，請先註冊或登入",
    loginModalBody: "登入後即可選擇支付方式並完成購買",
    loginNow: "立即登入",
    selectPaymentError: "請選擇支付方式",
    checkoutFailed: "結帳失敗，請稍後再試",
    redirectTitle: "付款導向",
    redirectMessage: "將導向 {provider} 付款頁面（模擬）",
    mobilePayTitle: "行動支付",
    mobilePayMessage: "將啟動 {provider}（模擬）",
  },
  checkoutSuccess: {
    seoTitle: "付款成功",
    seoDescription: "感謝您的購買",
    heading: "付款成功！",
    subtitle: "感謝您的購買，我們已收到您的訂單",
    orderNumber: "訂單編號",
    orderStatus: "訂單狀態",
    paid: "已付款",
    orderTime: "訂單時間",
    nextStepsTitle: "接下來會發生什麼？",
    step1: "我們會在 24 小時內與您聯繫，確認培訓時間",
    step2: "您將收到一封確認信件，包含培訓相關資訊",
    step3: "您可以在會員中心查看課程進度與培訓記錄",
    goToMemberCenter: "前往會員中心",
    backHome: "返回首頁",
    anyQuestions: "如有任何問題，請",
    contactUs: "聯絡我們",
  },
  coachDash: {
    heading: "教練儀表板",
    subtitle: "管理預約、時段與 Google 日曆整合",
    sun: "週日",
    mon: "週一",
    tue: "週二",
    wed: "週三",
    thu: "週四",
    fri: "週五",
    sat: "週六",
    tabPending: "🔔 待審核 ({count})",
    tabAll: "📅 全部預約",
    tabSchedule: "⚙️ 時段設定",
    tabGoogle: "🔗 Google 日曆",
    noPending: "沒有待審核的預約",
    noBookings: "尚無預約紀錄",
    anonymous: "(匿名)",
    syncedWithGoogle: "🔗 已同步 Google",
    noteLabel: "批註：",
    failedTitle: "失敗",
    approveFailed: "批准失敗",
    rejectFailed: "拒絕失敗",
    saveFailed: "儲存失敗",
    addTimeOffFailed: "新增休假失敗",
    cancelBookingMessage: "確定要取消 {name} 的預約？",
    deleteRuleTitle: "刪除規則",
    deleteTimeOffTitle: "刪除休假",
    thisTimeOff: "此休假",
    basicSettings: "基本設定",
    slotMinutes: "諮詢時長（分鐘）",
    noticeHours: "前置時間（小時）",
    windowDays: "可訂範圍（天）",
    cancellationHours: "取消時效（小時）",
    bookingOpen: "✅ 開放預約",
    bookingPaused: "⏸ 暫停預約",
    autoSaveHint: "修改後失焦（離開欄位）自動儲存",
    weeklySlots: "每週可預約時段",
    addRule: "+ 新增規則",
    noRules: "尚無規則，點右上「新增規則」開始",
    timeOff: "休假區間",
    addTimeOff: "+ 新增休假",
    noTimeOff: "未來無休假安排",
    googleSyncTitle: "Google 日曆同步",
    googleSyncDesc:
      "連結後，可預約時段會自動避開你 Google 日曆中已有的行程；批准預約時也會自動在日曆建立事件。",
    statusLabel: "狀態：",
    googleConnected: "✅ 已連結（Token 有效）",
    googleTokenExpired: "⚠️ 已連結但 Token 失效，請重新連結",
    googleNotConnected: "⚪ 未連結",
    connectGoogle: "連結 Google 日曆",
    reconnect: "重新連結",
    disconnect: "解除連結",
    googleMsgConnected: "✅ Google 日曆已連結",
    googleMsgDenied: "❌ 已拒絕授權",
    googleMsgNoCode: "❌ 授權流程異常（缺少 code）",
    googleMsgBadState: "❌ 授權狀態不匹配，請重試",
    googleMsgNoRefresh:
      "⚠️ Google 未回傳 refresh_token，請到 Google 帳號設定撤銷此應用後再試",
    googleMsgError: "❌ 授權失敗，請稍後再試",
    reviewTitle: "審核預約",
    userLabel: "用戶：",
    contactLabel: "聯絡：",
    reviewNoteLabel: "批註（選填，拒絕時建議說明理由）",
    reviewNotePlaceholder: "例：時段調整為下週三 14:00 / 很抱歉該時段臨時有事",
    reject: "拒絕",
    approveAndSync: "批准 + 同步 Google",
    editRuleTitle: "編輯規則",
    newRuleTitle: "新增規則",
    weekdayLabel: "週幾",
    startLabel: "開始",
    endLabel: "結束",
    addTimeOffTitle: "新增休假",
    startTimeLabel: "開始時間",
    endTimeLabel: "結束時間",
    reasonLabel: "備註（選填）",
    reasonPlaceholder: "例如：連假、出國、受訓",
    tapToReview: "點擊審核 →",
  },
  imageInput: {
    sourceTablist: "圖片來源",
    tabUpload: "上傳圖片",
    tabUrl: "Cloudinary 網址",
    previewFailed: "圖片無法載入",
    previewAlt: "圖片預覽",
    previewAltLabeled: "{label}預覽",
    uploading: "上傳中",
    dropToReplace: "放開以替換圖片",
    replace: "更換",
    cancelReplace: "取消更換",
    remove: "移除",
    uploaded: "已上傳",
    dropzoneHint: "拖曳圖片到這裡，或",
    dropzoneClick: "點擊選擇檔案",
    dropzoneMeta: "JPG / PNG / WebP / GIF / AVIF，最大 5 MB，上傳後自動壓縮",
    apply: "套用",
    requiredField: "此欄位為必填",
    legacyUrlWarning:
      "目前的網址不是允許的來源（可能是舊資料）。請改用上傳，或貼上 {prefix} 開頭的網址。",
    errUnsupportedType:
      "檔案格式不支援，請選擇 JPG / PNG / WebP / GIF / AVIF 圖片。",
    errTooLarge: "檔案太大（{size} MB），請壓縮到 5 MB 以內再上傳。",
    errUploadFailed: "上傳失敗，請重試。",
    errUrlSource:
      "網址須為 {prefix} 開頭的 Cloudinary 圖片，或本站已上傳圖片的網址",
    errUrlSourceExtra: "（{hint}）",
  },
  avatarUi: {
    cropHint: "拖曳調整位置 · 滾輪或滑桿縮放",
    processing: "處理中…",
    confirmCrop: "確認裁切",
    tabUpload: "上傳裁切",
    tabDicebear: "風格頭像",
    tabBoring: "幾何頭像",
    chooseImage: "選擇圖片",
    uploadHint: "支援 JPG / PNG / WebP，最大 5MB",
    randomize: "隨機生成",
    randomStyle: "隨機風格",
    useThisAvatar: "使用此頭像",
    styleAdventurer: "探險家",
    styleBottts: "機器人",
    styleFunEmoji: "趣味表情",
    styleNotionists: "Notion風",
    stylePixelArt: "像素風",
    styleThumbs: "讚",
    boringBeam: "光束",
    boringMarble: "大理石",
    boringPixel: "像素",
    boringSunset: "日落",
    boringRing: "圓環",
    boringBauhaus: "包浩斯",
  },
  richEditor: {
    placeholder: "開始撰寫內容...",
    sizeSmall: "小 ({v})",
    sizeMedium: "中 ({v})",
    sizeLarge: "大 ({v})",
    sizeFull: "全寬 ({v})",
    sizeXLarge: "超大 ({v})",
    errNoDrop: "不支援拖放上傳，請使用 Cloudinary 連結",
    errNoPaste: "請使用 Cloudinary 連結插入圖片，不支援直接貼上圖片",
    errImageSourceLegacy: "此圖片來源不在允許清單（可能是舊資料），建議重新上傳",
    errNeedImage: "請先上傳圖片或貼上圖片網址",
    errImageSourceInvalid:
      "圖片來源不合法，請改用上傳，或貼上本站 Cloudinary 帳號的網址。",
    errNeedVideoUrl: "請輸入影片網址",
    errYoutubeOnly: "⚠️ 只支援 YouTube 影片！\n請貼上 YouTube 影片連結",
    errNeedLinkUrl: "請輸入連結網址",
    defaultAlt: "圖片",
    toolBold: "粗體 (Ctrl+B)",
    toolItalic: "斜體 (Ctrl+I)",
    toolUnderline: "底線 (Ctrl+U)",
    toolStrike: "刪除線",
    toolH1: "標題 1",
    toolH2: "標題 2",
    toolH3: "標題 3",
    toolBullet: "項目符號",
    toolOrdered: "編號列表",
    toolAlignLeft: "靠左對齊",
    toolAlignCenter: "置中對齊",
    toolAlignRight: "靠右對齊",
    toolInsertImage: "插入 Cloudinary 圖片",
    toolInsertVideo: "插入 YouTube 影片",
    toolInsertLink: "插入連結",
    toolQuote: "引用",
    toolCode: "程式碼區塊",
    usageHint:
      "💡 提示：點擊已插入的圖片或影片可調整尺寸。只支援 Cloudinary 圖片和 YouTube 影片。",
    adjustImageSize: "調整圖片尺寸",
    adjustVideoSize: "調整影片尺寸",
    current: "目前：",
    currentSize: "目前尺寸：",
    insertImageTitle: "插入圖片",
    imageLabel: "圖片",
    altTextLabel: "替代文字（SEO 用）",
    altTextPlaceholder: "描述這張圖片的內容",
    sizeLabel: "尺寸",
    alignLabel: "對齊",
    alignLeftWrap: "靠左（文繞圖）",
    alignCenter: "置中",
    alignRightWrap: "靠右（文繞圖）",
    insertVideoTitle: "插入 YouTube 影片",
    insertVideoBtn: "插入影片",
    importantNotice: "⚠️ 重要提示",
    youtubeOnlyNotice: "只支援 YouTube 影片！請貼上 YouTube 網址。",
    youtubeUrlLabel: "YouTube 網址 *",
    videoSizeLabel: "影片尺寸",
    insertLinkTitle: "插入連結",
    linkUrlLabel: "連結網址 *",
    linkTextLabel: "顯示文字（選填）",
    linkTextPlaceholder: "點擊這裡",
  },
  imageGallery: {
    title: "📷 圖片庫",
    removeThisImage: "移除此圖片",
    emptyHint: "點擊上方「＋ 新增圖片」加入圖片，最多 {max} 張一排",
  },
  blockEditor: {
    errNeedImageUrl: "請輸入圖片網址",
    errImageSource: "圖片來源不合法，請使用本站上傳的圖片或 Cloudinary 網址。",
    errNeedYoutubeUrl: "請輸入 YouTube 網址",
    errYoutubeOnly: "只支援 YouTube 影片！",
    spacer: "間隔",
    addBlock: "新增區塊",
    blockText: "文字區塊",
    blockImage: "圖片",
    blockVideo: "YouTube 影片",
    blockDivider: "分隔線",
    blockSpacer: "間隔",
    undo: "復原 (Ctrl+Z)",
    redo: "重做 (Ctrl+Y)",
    showGrid: "顯示格線",
    properties: "屬性",
    position: "位置",
    size: "尺寸",
    width: "寬",
    height: "高",
    rotation: "旋轉",
    fontSize: "字體大小",
    bgColor: "背景顏色",
    textWrap: "文繞圖",
    none: "無",
    wrapLeft: "靠左（文字繞右）",
    wrapRight: "靠右（文字繞左）",
    borderRadius: "圓角",
    objectFit: "填充模式",
    fitCover: "裁切填滿",
    fitContain: "完整顯示",
    fitFill: "拉伸填滿",
    alignLeft: "靠左",
    alignRight: "靠右",
    duplicate: "複製區塊",
    bringToFront: "移至最前",
    sendToBack: "移至最後",
    lock: "🔒 鎖定位置",
    unlock: "🔓 解除鎖定",
    deleteBlock: "刪除區塊",
    addImageTitle: "新增 Cloudinary 圖片",
    cloudinaryNotice: "⚠️ 只支援 Cloudinary 圖片！請先上傳至 Cloudinary 再貼上網址。",
    addVideoTitle: "新增 YouTube 影片",
    youtubeOnlyNotice: "⚠️ 只支援 YouTube 影片！",
    imageLoadFailed: "圖片載入失敗",
    invalidYoutubeUrl: "無效的 YouTube 網址",
    doubleClickToEdit: "雙擊編輯文字",
    seedText: "雙擊編輯文字...",
  },
  globalSearch: {
    placeholder: "搜尋課程、文章、評論...",
    promptTitle: "輸入關鍵字開始搜尋",
    promptHint: "可搜尋課程名稱、文章標題、評論內容等",
    noResults: "找不到相關結果",
    noResultsHint: "嘗試使用其他關鍵字",
    typeComment: "留言",
    typeReview: "評價",
    hintNavigate: "導航",
    hintSelect: "選擇",
    triggerTitle: "搜尋 (Ctrl+K)",
  },
  whisperForm: {
    heading: "悄悄話",
    intro: "不想公開留言？可以在這裡說悄悄話（100字以內），訊息 30 天後自動消失。",
    nameLabel: "姓名 *",
    namePlaceholder: "你的名字",
    contactLabel: "聯絡方式 *",
    contactNote: "（Email 或台灣手機，不對外公開）",
    contactPlaceholder: "email@example.com 或 09xxxxxxxx",
    messageLabel: "悄悄話 *",
    messagePlaceholder: "想說的話...",
    submit: "送出悄悄話",
    footer: "訊息經過嚴格消毒，30天後自動刪除，不對外公開",
    nameLength: "姓名需在 1–50 字以內",
    contactRequired: "請填寫聯絡方式",
    contactInvalid: "聯絡方式需為有效 Email 或台灣手機（09xxxxxxxx）",
    messageLength: "悄悄話需在 1–100 字以內",
    sent: "悄悄話已送出！",
    sendFailed: "送出失敗，請稍後再試",
    networkError: "網路錯誤，請稍後再試",
  },
  dataTable: {
    sortLabel: "排序：",
    sortDefault: "預設",
  },
  statusBadge: {
    draft: "草稿",
    published: "已發布",
    archived: "已封存",
    active: "啟用",
    inactive: "停用",
    pending: "待審核",
  },
  formUi: {
    searchPlaceholder: "搜尋...",
    toggleOn: "開",
    toggleOff: "關",
    tagInputPlaceholder: "輸入後按 Enter 新增",
    tagExists: "標籤已存在",
    tagMax: "最多只能新增 {max} 個標籤",
    tagInvalid: "標籤格式不正確",
    tagCount: "已新增 {count} / {max} 個標籤",
    removeTag: "移除 {tag}",
  },
  carouselUi: {
    clickHint: "點擊看下一張",
    nextItem: "下一段",
    prevSlide: "上一張",
    nextSlide: "下一張",
    goToSlide: "第 {n} 張",
    expand: "展開：{title}",
    prevBatch: "上一批",
    nextBatch: "下一批",
  },
  uiCommon: {
    goTo: "前往",
    notifications: "通知",
    insertImage: "插入圖片",
    insert: "插入",
    invalidUrl: "請輸入有效的網址",
    inputRequired: "請輸入內容",
    errorTitle: "頁面載入發生錯誤",
    unknownError: "未知錯誤",
    reload: "重新載入",
  },
  memberFeedback: {
    seoTitle: "意見反饋",
    heading: "意見反饋",
    subtitle: "把問題或想法告訴教練，他會回覆你，一來一往慢慢聊 😊",
    newFeedback: "＋ 新增反饋",
    searchPlaceholder: "搜尋標題…",
    loadFailed: "載入反饋失敗",
    empty: "還沒有任何反饋",
    emptyHint: "有問題或建議嗎？點右上角「新增反饋」開始吧！",
    emptySearch: "找不到符合的反饋",
    backToList: "← 返回列表",
    messagesCount: "{n} 則訊息",
    lastUpdated: "最後更新 {time}",
    waitingCoach: "還在等教練回覆 →",
    yourTurn: "換你回覆了 →",
    statusLabel: {
      waiting_member: "等待你回應",
      waiting_coach: "等待教練回應",
      in_progress: "處理中",
      resolved: "已完成",
    },
    modal: {
      title: "新增反饋",
      titleLabel: "標題",
      titlePlaceholder: "用一句話描述你的問題或想法",
      contentLabel: "內容",
      contentPlaceholder: "詳細說說看，教練才能幫上忙…",
      attachLabel: "附上圖片（選填）",
      submit: "送出",
      submitting: "送出中…",
      cancel: "取消",
    },
    attach: {
      dropHint: "拖放、點擊上傳，或直接貼上截圖",
      remaining: "還能加 {n} 張",
      tooMany: "最多只能上傳 {n} 張圖片",
      tooLarge: "單張圖片不能超過 10MB",
      badType: "只支援 JPG／PNG／WebP／GIF",
      removeAria: "移除這張圖片",
    },
    reply: {
      placeholder: "輸入訊息…（可貼上截圖）",
      send: "送出",
      sending: "送出中…",
    },
    conversation: {
      roleMember: "學員",
      roleCoach: "教練",
      edited: "已編輯",
      edit: "編輯",
      delete: "刪除",
      save: "儲存",
      cancel: "取消",
    },
    deleteMsgTitle: "刪除訊息",
    deleteMsgMessage: "確定要刪除這則訊息嗎？此動作無法復原。",
    validation: {
      titleRequired: "請填寫標題",
      contentRequired: "請填寫內容或附上圖片",
    },
    errors: {
      createFailed: "送出反饋失敗，請稍後再試",
      replyFailed: "回覆失敗，請稍後再試",
      editFailed: "編輯失敗，請稍後再試",
      deleteFailed: "刪除失敗，請稍後再試",
    },
  },
  notes: {
    seoTitle: "課程筆記本 | 阿倫教官",
    heading: "課程筆記本",
    subtitle: "你和教練共同維護的課程筆記，兩邊都能編輯",
    loadFailed: "載入失敗，請稍後再試",
    retry: "重試",
    unavailableTitle: "筆記本尚未啟用",
    unavailableBody:
      "資料表還沒建立。請先到 Supabase Dashboard 執行 database/migrations/039_client_notes.sql，再回來重新整理。",
    listEmptyOwner: "還沒有任何筆記本，按右上角「建立筆記本」開始。",
    listEmptyClient: "教練還沒為你建立筆記本。",
    cardCourse: "課程",
    cardClient: "客戶",
    cardUpdated: "更新於 ",
    create: {
      button: "建立筆記本",
      title: "建立客戶筆記本",
      clientLabel: "客戶",
      clientSearch: "搜尋姓名或 Email…",
      clientEmpty: "找不到符合的會員",
      courseLabel: "課程",
      coursePlaceholder: "請選擇課程",
      titleLabel: "筆記本名稱",
      titlePlaceholder: "例如：2026 春季增肌計畫",
      grantLabel: "順便開通這門課的授權",
      grantHint: "沒有課程授權的話，客戶在自己的頁面看不到這本筆記本。",
      submit: "建立",
      submitting: "建立中…",
      errRequired: "客戶、課程與名稱都要填。",
      errFailed: "建立失敗，請稍後再試",
    },
    del: {
      button: "刪除",
      confirmTitle: "刪除筆記本",
      confirmMessage: "確定要刪除「{name}」嗎？客戶將立刻看不到這本筆記本。",
      confirmText: "刪除",
      failed: "刪除失敗，請稍後再試",
    },
    backToList: "回到筆記本列表",
    pagesHeading: "頁面",
    openTree: "目錄",
    closeTree: "關閉目錄",
    noSelection: "請從左側選一頁開始。",
    treeEmpty: "這本筆記本還沒有任何頁面。",
    untitled: "未命名頁面",
    expand: "展開",
    collapse: "收合",
    addChild: "新增子頁",
    addChildFailed: "新增子頁失敗",
    rename: "重新命名",
    renameTitle: "重新命名頁面",
    renameMessage: "輸入新的頁面名稱",
    renameFailed: "重新命名失敗",
    moveTo: "移動到…",
    moveTitle: "移動頁面",
    moveHint: "選一個新的上層頁面來放「{name}」（它的子頁會一起搬過去）。",
    moveCurrentParent: "目前位置",
    moveNoTarget: "沒有可以搬過去的頁面。",
    moveFailed: "搬移失敗",
    deletePage: "刪除頁面",
    deleteTitle: "刪除頁面",
    deleteMessage: "確定要刪除「{name}」嗎？它底下的所有子頁也會一起刪除。",
    deleteConfirm: "刪除",
    deleteFailed: "刪除失敗",
    titlePlaceholder: "未命名頁面",
    editorLoading: "編輯器載入中…",
    saveDirty: "尚未儲存",
    saving: "儲存中…",
    saved: "已儲存",
    saveFailed: "儲存失敗",
    saveConflict: "內容衝突",
    conflictBody: "內容已被對方更新，請重新載入後再編輯（你剛才的變更尚未存檔）。",
    conflictReload: "重新載入",
    dbAddCard: "新增子頁",
    dbEmpty: "還沒有任何子頁。按任一欄下方的「＋ 新增」開始。",
    typePage: "頁面",
    typeDatabase: "看板",
    board: {
      uncategorized: "未分類",
      addCard: "新增",
      columnEmpty: "這一欄還沒有卡片",
      manageCategories: "管理分類",
      dragHint: "拖曳卡片就能換分類",
      dragHintMobile: "用卡片上的「⋯」換分類",
      moveTo: "移到分類…",
      moveHint: "把「{name}」移到哪一個分類？",
      moveFailed: "移動卡片失敗，請稍後再試",
      updatedAt: "更新於 ",
    },
    cat: {
      title: "管理分類",
      hint: "分類就是看板上的欄位，由左到右排列。改完按「儲存」才會生效。",
      namePlaceholder: "分類名稱，例如：第 1 期",
      unnamed: "未命名分類",
      add: "新增分類",
      color: "選擇顏色",
      moveLeft: "往左移",
      moveRight: "往右移",
      remove: "刪除分類",
      removeConfirmTitle: "刪除分類",
      removeConfirmMessage:
        "確定要刪除分類「{name}」嗎？原本在這一欄的卡片不會消失，會全部歸入「未分類」。",
      removeConfirmText: "刪除",
      save: "儲存",
      saving: "儲存中…",
      cancel: "取消",
      empty: "還沒有任何分類，所有卡片都會放在「未分類」。",
      nameRequired: "分類名稱不能空白。",
      saveFailed: "儲存分類失敗，請稍後再試",
      limitReached: "分類數量已達上限",
    },
    slash: {
      group: "筆記本",
      subPageTitle: "子頁面",
      subPageSubtext: "建立一頁並在這裡插入連結",
      databaseTitle: "資料庫",
      databaseSubtext: "建立一個分類看板並插入連結",
    },
    pageLink: {
      open: "開啟頁面",
      deleted: "已刪除的頁面",
      badgeDatabase: "資料庫",
    },
  },
};

const en: MemberExtraTranslations = {
  dateTime: {
    today: "Today",
    yesterday: "Yesterday",
    justNow: "just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} hr ago",
    daysAgo: "{n} days ago",
  },
  dashboard: {
    seoTitle: "Member Dashboard | Coach Aaron",
    welcome: "Welcome back, {name}",
    guestName: "Student",
    subtitle: "Continue your fitness journey",
    statWeeklyProgress: "Weekly Progress",
    statCompletedLessons: "Lessons Completed",
    statTotalMinutes: "Total Minutes",
    statStreakDays: "Day Streak",
    continueLearning: "Continue Learning",
    demoCourse1: "Fitness Fundamentals for Beginners",
    demoCourse2: "Practical Muscle-Building Program",
    today: "today",
    yesterday: "yesterday",
    lastStudied: "Last studied {when}",
    noCoursesStarted: "You haven't started any courses yet",
    quickActions: "Quick Actions",
    actionWatchVideos: "Watch Videos",
    actionContactCoach: "Contact Coach",
  },
  memberCenter: {
    seoTitle: "Member Center | Coach Aaron",
    welcomeLine: "Welcome back, {name}",
    downloadFailed: "Download failed",
    chatFilePrefix: "chat",
  },
  bookingStatus: {
    pending: "Awaiting coach confirmation",
    confirmed: "Confirmed",
    rejected: "Declined",
    cancelled: "Cancelled",
    completed: "Completed",
  },
  bookingPage: {
    loadFailed: "Failed to load consultation slots",
    coachUnavailable: "The coach is not accepting bookings right now",
    heading: "Book a consultation with {coach}",
    meta: "{minutes} minutes per session · Timezone {timezone} · Book at least {noticeHours} hours ahead · Up to {windowDays} days in advance",
    calendarHint: "🟢 Highlighted dates have open slots — tap one to select it",
    dayHeadingFormat: "MMMM d, yyyy",
    slotsForDay: "Available times on {date}",
    pickDayFirst: "Pick a date on the left to begin",
    noSlotsThatDay: "No slots available on this date",
    viewMyBookingsPrefix: "Want to review your own bookings? Go to",
    submitTitle: "Submit Booking",
    submitting: "Submitting...",
    slotLabel: "Time slot:",
    durationLabel: "{minutes} minutes",
    courseLabel: "Course you'd like to discuss (optional)",
    courseNone: "Not specified",
    noteLabel: "What would you like to talk about? (optional)",
    notePlaceholder:
      "e.g. I'd like to know more about a course, or I have a question to discuss...",
    contactEmailLabel: "Contact Email",
    contactEmailPlaceholder: "Booking updates will be sent to this address",
    contactPhoneLabel: "Contact Phone",
    contactRequired: "Please provide at least an email or a phone number",
    contactHint: "At least one of email or phone is required.",
    submitSuccessTitle: "Request Sent",
    submitSuccessMessage:
      "Your booking request has been submitted. You'll receive an email once the coach confirms it.",
    submitFailed: "Failed to submit the booking, please try again later",
  },
  myBookings: {
    heading: "My Bookings",
    subtitle: "Review every consultation request you've submitted",
    newBooking: "+ New Booking",
    loadFailed: "Failed to load bookings",
    empty: "No bookings yet — ",
    emptyCta: "book a consultation now",
    relatedCourse: "📚 Related course: ",
    coachNote: "Coach's note: ",
    submittedAt: "Submitted on",
    cancelTitle: "Cancel Booking",
    cancelMessage: "Cancel your booking on {time}?",
    cancelFailed: "Cancellation failed, please contact the coach",
  },
  notificationsPage: {
    heading: "Notifications",
    subtitle: "Everything from the last 7 days; older items are cleared automatically",
    markAllRead: "Mark all as read",
    pushHeading: "📱 Browser Push Notifications",
    pushUnsupported: "Your browser doesn't support push notifications",
    pushOn: "✅ Enabled — you'll get push alerts even with the browser closed",
    pushOff:
      "Currently off. Turn it on to receive new messages and booking alerts even when the browser is closed",
    pushBusy: "Working...",
    pushEnable: "Enable Push",
    pushDisable: "Disable",
    toggleFailed: "Failed to toggle",
    unread: "Unread",
    emptyUnread: "No unread notifications",
    emptyAll: "No notifications yet",
    backHome: "Back to home",
  },
  chatUi: {
    messages: "Messages",
    newChat: "New conversation",
    pickConversation: "Pick a conversation on the left to start chatting",
    orStartNew: "or start a new conversation",
    conversationMissing: "This conversation doesn't exist or has been removed",
    noConversations: "No messages yet",
    noConversationsHint: "Start your first conversation",
    startNewChat: "New conversation",
    left: "Left",
    noMessagesYet: "(No messages yet)",
    noMessagesGreeting: "No messages yet — say hello!",
    leftGroupNotice:
      "🚪 You've left this group and can no longer send messages (you can still read past ones)",
    memberCount: "{count} members",
    viewMembers: "View members",
    close: "Close",
    groupFallback: "Group",
    conversationFallback: "Conversation",
    userFallback: "User",
    imagePreview: "📷 Photo",
    lastSeenNever: "Never online",
    lastSeenOnline: "Online now",
    lastSeenMinutes: "Last seen {count} min ago",
    lastSeenHours: "Last seen {count} hr ago",
    lastSeenYesterday: "Last seen yesterday",
    lastSeenDays: "Last seen {count} days ago",
    imageTypeError: "Only jpg/png/webp/gif files are supported",
    imageTooLarge: "Images must be 5 MB or smaller",
    sendFailedRestored: "Sending failed — your message has been restored",
    previewAlt: "Preview",
    removeImage: "Remove image",
    attachImage: "Attach image",
    inputPlaceholder: "Type a message... (Enter to send / Shift+Enter for a new line)",
    attachedImageAlt: "Attached image",
    membersTitle: "👥 {group} — Members ({count})",
    addMember: "+ Add member",
    done: "Done",
    searchMemberPlaceholder: "Search by name or email...",
    noMemberFound: "No matching members found",
    searchPrompt: "Type a keyword to search",
    addAction: "+ Add",
    you: "You",
    yourself: "(You)",
    adminTag: "Admin",
    ownerTag: "Owner",
    leave: "Leave",
    remove: "Remove",
    leaveGroupTitle: "Leave Group",
    leaveGroupMessage:
      "Leave “{group}”?\nYou'll still see past messages, but you won't be able to send or receive new ones.",
    removeMemberTitle: "Remove Member",
    removeMemberMessage:
      "Remove {name} from this group? They'll keep access to messages sent before removal, but won't see new ones.",
    actionFailed: "Action failed",
    addFailed: "Failed to add member",
    tryAgainLater: "Please try again later",
    newChatTitle: "Start a New Conversation",
    tabDm: "💬 Direct message",
    tabGroup: "👥 Create group",
    adminsAndCoaches: "Admins / Coaches",
    tapToToggle: "(tap to toggle selection)",
    otherMembers: "👥 Other members",
    comboboxPlaceholder: "Tap to browse or type a name...",
    searching: "Searching...",
    noOtherMembers: "No other members yet",
    searchOtherMembers: "Search other members...",
    groupNameLabel: "Group name",
    groupNamePlaceholder: "e.g. Coaching team · Student A group",
    selectedCount: "{count} selected:",
    searchAndAddPlaceholder: "Search members by name to add them...",
    creating: "Creating...",
    createGroupBtn: "Create group ({count})",
    groupNameRequired: "Please enter a group name",
    pickAtLeastOne: "Please select at least one member",
    openChatFailed: "Failed to open the conversation",
    createGroupFailed: "Failed to create the group",
  },
  checkoutPage: {
    seoTitle: "Checkout - {plan}",
    seoDescription:
      "A fast, secure checkout supporting multiple payment methods",
    heading: "Confirm Your Order",
    subtitle: "Review your order details and choose a payment method",
    step1: "Choose plan",
    step2: "Choose payment",
    step3: "Complete payment",
    choosePayment: "Choose a Payment Method",
    comingSoon: "Coming soon",
    payLinePayDesc: "Pay quickly with LINE Pay",
    payNewebPayName: "NewebPay",
    payNewebPayDesc: "Credit card, ATM transfer, convenience store code",
    payEcPayName: "ECPay",
    payEcPayDesc: "Credit card, ATM, convenience store payment",
    payJkoPayName: "JKOPay",
    payJkoPayDesc: "Scan and pay with JKOPay",
    payApplePayDesc: "Check out quickly with Apple Pay",
    payGooglePayDesc: "Check out quickly with Google Pay",
    plan3mTitle: "3-Month Coaching Plan",
    plan3mDuration: "3 months",
    plan3mDesc: "12 one-on-one sessions",
    plan6mTitle: "6-Month Coaching Plan",
    plan6mDuration: "6 months",
    plan6mDesc: "24 one-on-one sessions",
    plan1yTitle: "1-Year Coaching Plan",
    plan1yDuration: "1 year",
    plan1yDesc: "48 one-on-one sessions",
    orderNoteLabel: "Order Notes (optional)",
    orderNotePlaceholder: "Let us know if you have any special requests...",
    planDuration: "Plan duration: {duration}",
    planFee: "Plan fee",
    bonusCourses: "Bonus courses",
    includedInPlan: "Included in plan",
    amountDue: "Amount due",
    processing: "Processing...",
    confirmPayment: "Confirm Payment",
    loginToPurchase: "Please sign in to complete your purchase",
    registerNewAccount: "Create an account",
    sslNotice: "Secured with SSL encryption",
    backToCourses: "← Back to courses",
    loginRequiredTitle: "Sign In Required",
    loginModalHeading: "Please register or sign in to purchase a course",
    loginModalBody:
      "Once signed in you can choose a payment method and complete your purchase",
    loginNow: "Sign in now",
    selectPaymentError: "Please choose a payment method",
    checkoutFailed: "Checkout failed, please try again later",
    redirectTitle: "Payment Redirect",
    redirectMessage: "Redirecting to the {provider} payment page (simulated)",
    mobilePayTitle: "Mobile Payment",
    mobilePayMessage: "Launching {provider} (simulated)",
  },
  checkoutSuccess: {
    seoTitle: "Payment Successful",
    seoDescription: "Thank you for your purchase",
    heading: "Payment Successful!",
    subtitle: "Thank you for your purchase — we've received your order",
    orderNumber: "Order number",
    orderStatus: "Order status",
    paid: "Paid",
    orderTime: "Order time",
    nextStepsTitle: "What happens next?",
    step1: "We'll contact you within 24 hours to schedule your sessions",
    step2: "You'll receive a confirmation email with your program details",
    step3: "You can track course progress and session history in Member Center",
    goToMemberCenter: "Go to Member Center",
    backHome: "Back to Home",
    anyQuestions: "Any questions? Please ",
    contactUs: "contact us",
  },
  coachDash: {
    heading: "Coach Dashboard",
    subtitle: "Manage bookings, availability and Google Calendar sync",
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    tabPending: "🔔 Pending ({count})",
    tabAll: "📅 All bookings",
    tabSchedule: "⚙️ Availability",
    tabGoogle: "🔗 Google Calendar",
    noPending: "No bookings awaiting review",
    noBookings: "No bookings yet",
    anonymous: "(Anonymous)",
    syncedWithGoogle: "🔗 Synced to Google",
    noteLabel: "Note: ",
    failedTitle: "Failed",
    approveFailed: "Failed to approve the booking",
    rejectFailed: "Failed to decline the booking",
    saveFailed: "Failed to save",
    addTimeOffFailed: "Failed to add time off",
    cancelBookingMessage: "Cancel {name}'s booking?",
    deleteRuleTitle: "Delete Rule",
    deleteTimeOffTitle: "Delete Time Off",
    thisTimeOff: "this time off",
    basicSettings: "Basic Settings",
    slotMinutes: "Session length (minutes)",
    noticeHours: "Minimum notice (hours)",
    windowDays: "Booking window (days)",
    cancellationHours: "Cancellation cutoff (hours)",
    bookingOpen: "✅ Accepting bookings",
    bookingPaused: "⏸ Bookings paused",
    autoSaveHint: "Changes save automatically when you leave the field",
    weeklySlots: "Weekly Availability",
    addRule: "+ Add rule",
    noRules: "No rules yet — tap “Add rule” above to get started",
    timeOff: "Time Off",
    addTimeOff: "+ Add time off",
    noTimeOff: "No upcoming time off",
    googleSyncTitle: "Google Calendar Sync",
    googleSyncDesc:
      "Once connected, available slots automatically avoid existing events in your Google Calendar, and approved bookings are added to it as events.",
    statusLabel: "Status: ",
    googleConnected: "✅ Connected (token valid)",
    googleTokenExpired: "⚠️ Connected but the token has expired — please reconnect",
    googleNotConnected: "⚪ Not connected",
    connectGoogle: "Connect Google Calendar",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    googleMsgConnected: "✅ Google Calendar connected",
    googleMsgDenied: "❌ Authorization denied",
    googleMsgNoCode: "❌ Authorization failed (missing code)",
    googleMsgBadState: "❌ Authorization state mismatch, please try again",
    googleMsgNoRefresh:
      "⚠️ Google did not return a refresh_token. Revoke this app in your Google Account settings and try again.",
    googleMsgError: "❌ Authorization failed, please try again later",
    reviewTitle: "Review Booking",
    userLabel: "Member: ",
    contactLabel: "Contact: ",
    reviewNoteLabel: "Note (optional — recommended when declining)",
    reviewNotePlaceholder:
      "e.g. Moved to next Wednesday 14:00 / Sorry, something came up during that slot",
    reject: "Decline",
    approveAndSync: "Approve + sync to Google",
    editRuleTitle: "Edit Rule",
    newRuleTitle: "New Rule",
    weekdayLabel: "Day of week",
    startLabel: "Start",
    endLabel: "End",
    addTimeOffTitle: "Add Time Off",
    startTimeLabel: "Start time",
    endTimeLabel: "End time",
    reasonLabel: "Note (optional)",
    reasonPlaceholder: "e.g. Public holiday, travel, training",
    tapToReview: "Tap to review →",
  },
  imageInput: {
    sourceTablist: "Image source",
    tabUpload: "Upload image",
    tabUrl: "Cloudinary URL",
    previewFailed: "Image could not be loaded",
    previewAlt: "Image preview",
    previewAltLabeled: "{label} preview",
    uploading: "Uploading",
    dropToReplace: "Drop to replace the image",
    replace: "Replace",
    cancelReplace: "Cancel replace",
    remove: "Remove",
    uploaded: "Uploaded",
    dropzoneHint: "Drag an image here, or ",
    dropzoneClick: "click to choose a file",
    dropzoneMeta:
      "JPG / PNG / WebP / GIF / AVIF, up to 5 MB — compressed automatically after upload",
    apply: "Apply",
    requiredField: "This field is required",
    legacyUrlWarning:
      "The current URL isn't from an allowed source (it may be legacy data). Please upload the image instead, or paste a URL starting with {prefix}.",
    errUnsupportedType:
      "Unsupported file type. Please choose a JPG / PNG / WebP / GIF / AVIF image.",
    errTooLarge:
      "File is too large ({size} MB). Please compress it to under 5 MB before uploading.",
    errUploadFailed: "Upload failed, please try again.",
    errUrlSource:
      "The URL must be a Cloudinary image starting with {prefix}, or a URL of an image already uploaded to this site",
    errUrlSourceExtra: " ({hint})",
  },
  avatarUi: {
    cropHint: "Drag to reposition · scroll or use the slider to zoom",
    processing: "Processing…",
    confirmCrop: "Confirm Crop",
    tabUpload: "Upload & Crop",
    tabDicebear: "Illustrated",
    tabBoring: "Geometric",
    chooseImage: "Choose an image",
    uploadHint: "JPG / PNG / WebP supported, up to 5 MB",
    randomize: "Randomize",
    randomStyle: "Random style",
    useThisAvatar: "Use this avatar",
    styleAdventurer: "Adventurer",
    styleBottts: "Robots",
    styleFunEmoji: "Fun Emoji",
    styleNotionists: "Notionists",
    stylePixelArt: "Pixel Art",
    styleThumbs: "Thumbs",
    boringBeam: "Beam",
    boringMarble: "Marble",
    boringPixel: "Pixel",
    boringSunset: "Sunset",
    boringRing: "Ring",
    boringBauhaus: "Bauhaus",
  },
  richEditor: {
    placeholder: "Start writing...",
    sizeSmall: "Small ({v})",
    sizeMedium: "Medium ({v})",
    sizeLarge: "Large ({v})",
    sizeFull: "Full width ({v})",
    sizeXLarge: "Extra large ({v})",
    errNoDrop: "Drag-and-drop upload isn't supported — please use a Cloudinary link",
    errNoPaste:
      "Please insert images with a Cloudinary link; pasting images directly isn't supported",
    errImageSourceLegacy:
      "This image source isn't on the allowlist (it may be legacy data) — re-uploading is recommended",
    errNeedImage: "Please upload an image or paste an image URL first",
    errImageSourceInvalid:
      "Invalid image source. Please upload the image instead, or paste a URL from this site's Cloudinary account.",
    errNeedVideoUrl: "Please enter a video URL",
    errYoutubeOnly: "⚠️ Only YouTube videos are supported!\nPlease paste a YouTube link",
    errNeedLinkUrl: "Please enter a link URL",
    defaultAlt: "Image",
    toolBold: "Bold (Ctrl+B)",
    toolItalic: "Italic (Ctrl+I)",
    toolUnderline: "Underline (Ctrl+U)",
    toolStrike: "Strikethrough",
    toolH1: "Heading 1",
    toolH2: "Heading 2",
    toolH3: "Heading 3",
    toolBullet: "Bulleted list",
    toolOrdered: "Numbered list",
    toolAlignLeft: "Align left",
    toolAlignCenter: "Align center",
    toolAlignRight: "Align right",
    toolInsertImage: "Insert Cloudinary image",
    toolInsertVideo: "Insert YouTube video",
    toolInsertLink: "Insert link",
    toolQuote: "Blockquote",
    toolCode: "Code block",
    usageHint:
      "💡 Tip: click an inserted image or video to resize it. Only Cloudinary images and YouTube videos are supported.",
    adjustImageSize: "Adjust image size",
    adjustVideoSize: "Adjust video size",
    current: "Current:",
    currentSize: "Current size:",
    insertImageTitle: "Insert Image",
    imageLabel: "Image",
    altTextLabel: "Alt text (for SEO)",
    altTextPlaceholder: "Describe what's in this image",
    sizeLabel: "Size",
    alignLabel: "Alignment",
    alignLeftWrap: "Left (text wraps)",
    alignCenter: "Center",
    alignRightWrap: "Right (text wraps)",
    insertVideoTitle: "Insert YouTube Video",
    insertVideoBtn: "Insert Video",
    importantNotice: "⚠️ Important",
    youtubeOnlyNotice: "Only YouTube videos are supported — please paste a YouTube URL.",
    youtubeUrlLabel: "YouTube URL *",
    videoSizeLabel: "Video size",
    insertLinkTitle: "Insert Link",
    linkUrlLabel: "Link URL *",
    linkTextLabel: "Display text (optional)",
    linkTextPlaceholder: "Click here",
  },
  imageGallery: {
    title: "📷 Image gallery",
    removeThisImage: "Remove this image",
    emptyHint:
      "Use “＋ Add image” above to add images — up to {max} per row",
  },
  blockEditor: {
    errNeedImageUrl: "Please enter an image URL",
    errImageSource:
      "Invalid image source. Please use an image uploaded to this site or a Cloudinary URL.",
    errNeedYoutubeUrl: "Please enter a YouTube URL",
    errYoutubeOnly: "Only YouTube videos are supported!",
    spacer: "Spacer",
    addBlock: "Add block",
    blockText: "Text block",
    blockImage: "Image",
    blockVideo: "YouTube video",
    blockDivider: "Divider",
    blockSpacer: "Spacer",
    undo: "Undo (Ctrl+Z)",
    redo: "Redo (Ctrl+Y)",
    showGrid: "Show grid",
    properties: "Properties",
    position: "Position",
    size: "Size",
    width: "W",
    height: "H",
    rotation: "Rotation",
    fontSize: "Font size",
    bgColor: "Background color",
    textWrap: "Text wrap",
    none: "None",
    wrapLeft: "Left (text wraps right)",
    wrapRight: "Right (text wraps left)",
    borderRadius: "Corner radius",
    objectFit: "Fill mode",
    fitCover: "Crop to fill",
    fitContain: "Fit entire image",
    fitFill: "Stretch to fill",
    alignLeft: "Left",
    alignRight: "Right",
    duplicate: "Duplicate block",
    bringToFront: "Bring to front",
    sendToBack: "Send to back",
    lock: "🔒 Lock position",
    unlock: "🔓 Unlock",
    deleteBlock: "Delete block",
    addImageTitle: "Add Cloudinary Image",
    cloudinaryNotice:
      "⚠️ Only Cloudinary images are supported! Upload to Cloudinary first, then paste the URL.",
    addVideoTitle: "Add YouTube Video",
    youtubeOnlyNotice: "⚠️ Only YouTube videos are supported!",
    imageLoadFailed: "Image failed to load",
    invalidYoutubeUrl: "Invalid YouTube URL",
    doubleClickToEdit: "Double-click to edit text",
    seedText: "Double-click to edit this text...",
  },
  globalSearch: {
    placeholder: "Search courses, articles, comments...",
    promptTitle: "Type a keyword to start searching",
    promptHint: "Search course names, article titles, comment content and more",
    noResults: "No results found",
    noResultsHint: "Try a different keyword",
    typeComment: "Comment",
    typeReview: "Review",
    hintNavigate: "Navigate",
    hintSelect: "Select",
    triggerTitle: "Search (Ctrl+K)",
  },
  whisperForm: {
    heading: "Whisper",
    intro:
      "Rather not comment publicly? Send a private whisper (up to 100 characters) — it's deleted automatically after 30 days.",
    nameLabel: "Name *",
    namePlaceholder: "Your name",
    contactLabel: "Contact *",
    contactNote: "(Email or Taiwan mobile — never shown publicly)",
    contactPlaceholder: "email@example.com or 09xxxxxxxx",
    messageLabel: "Whisper *",
    messagePlaceholder: "What's on your mind...",
    submit: "Send Whisper",
    footer:
      "Messages are strictly sanitized, deleted after 30 days, and never made public",
    nameLength: "Name must be between 1 and 50 characters",
    contactRequired: "Please provide a contact method",
    contactInvalid:
      "Contact must be a valid email or Taiwan mobile number (09xxxxxxxx)",
    messageLength: "Your whisper must be between 1 and 100 characters",
    sent: "Whisper sent!",
    sendFailed: "Failed to send, please try again later",
    networkError: "Network error, please try again later",
  },
  dataTable: {
    sortLabel: "Sort:",
    sortDefault: "Default",
  },
  statusBadge: {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    active: "Active",
    inactive: "Inactive",
    pending: "Pending Review",
  },
  formUi: {
    searchPlaceholder: "Search...",
    toggleOn: "On",
    toggleOff: "Off",
    tagInputPlaceholder: "Type and press Enter to add",
    tagExists: "Tag already exists",
    tagMax: "You can add at most {max} tags",
    tagInvalid: "Invalid tag format",
    tagCount: "{count} / {max} tags added",
    removeTag: "Remove {tag}",
  },
  carouselUi: {
    clickHint: "Click for the next one",
    nextItem: "Next item",
    prevSlide: "Previous slide",
    nextSlide: "Next slide",
    goToSlide: "Go to slide {n}",
    expand: "Expand: {title}",
    prevBatch: "Previous set",
    nextBatch: "Next set",
  },
  uiCommon: {
    goTo: "Visit",
    notifications: "Notifications",
    insertImage: "Insert image",
    insert: "Insert",
    invalidUrl: "Please enter a valid URL",
    inputRequired: "Please enter something",
    errorTitle: "Something went wrong loading this page",
    unknownError: "Unknown error",
    reload: "Reload",
  },
  memberFeedback: {
    seoTitle: "Feedback",
    heading: "Feedback",
    subtitle: "Tell your coach what's on your mind — he'll reply, and you can chat back and forth 😊",
    newFeedback: "＋ New feedback",
    searchPlaceholder: "Search titles…",
    loadFailed: "Failed to load feedback",
    empty: "No feedback yet",
    emptyHint: "Got a question or an idea? Tap \"New feedback\" in the top right to start.",
    emptySearch: "No feedback matches your search",
    backToList: "← Back to list",
    messagesCount: "{n} messages",
    lastUpdated: "Updated {time}",
    waitingCoach: "Waiting on your coach →",
    yourTurn: "Your turn to reply →",
    statusLabel: {
      waiting_member: "Waiting on you",
      waiting_coach: "Waiting on coach",
      in_progress: "In progress",
      resolved: "Resolved",
    },
    modal: {
      title: "New feedback",
      titleLabel: "Title",
      titlePlaceholder: "Describe your question or idea in one line",
      contentLabel: "Details",
      contentPlaceholder: "Tell us more so your coach can help…",
      attachLabel: "Attach images (optional)",
      submit: "Send",
      submitting: "Sending…",
      cancel: "Cancel",
    },
    attach: {
      dropHint: "Drop, click to upload, or paste a screenshot",
      remaining: "{n} more allowed",
      tooMany: "Up to {n} images only",
      tooLarge: "Each image must be under 10MB",
      badType: "Only JPG / PNG / WebP / GIF are supported",
      removeAria: "Remove this image",
    },
    reply: {
      placeholder: "Type a message… (you can paste screenshots)",
      send: "Send",
      sending: "Sending…",
    },
    conversation: {
      roleMember: "Member",
      roleCoach: "Coach",
      edited: "edited",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
    },
    deleteMsgTitle: "Delete message",
    deleteMsgMessage: "Delete this message? This can't be undone.",
    validation: {
      titleRequired: "Please enter a title",
      contentRequired: "Please add a message or an image",
    },
    errors: {
      createFailed: "Couldn't send feedback, please try again",
      replyFailed: "Couldn't send reply, please try again",
      editFailed: "Couldn't edit, please try again",
      deleteFailed: "Couldn't delete, please try again",
    },
  },
  notes: {
    seoTitle: "Course notebook | Coach Aaron",
    heading: "Course notebook",
    subtitle: "Notes you and your coach keep together — both of you can edit",
    loadFailed: "Couldn't load, please try again",
    retry: "Retry",
    unavailableTitle: "Notebooks aren't set up yet",
    unavailableBody:
      "The tables don't exist yet. Run database/migrations/039_client_notes.sql in the Supabase Dashboard, then reload this page.",
    listEmptyOwner: "No notebooks yet — hit \"New notebook\" to create the first one.",
    listEmptyClient: "Your coach hasn't set up a notebook for you yet.",
    cardCourse: "Course",
    cardClient: "Client",
    cardUpdated: "Updated ",
    create: {
      button: "New notebook",
      title: "New client notebook",
      clientLabel: "Client",
      clientSearch: "Search by name or email…",
      clientEmpty: "No matching members",
      courseLabel: "Course",
      coursePlaceholder: "Pick a course",
      titleLabel: "Notebook name",
      titlePlaceholder: "e.g. Spring 2026 hypertrophy block",
      grantLabel: "Also grant access to this course",
      grantHint:
        "Without course access, the client won't see this notebook on their side.",
      submit: "Create",
      submitting: "Creating…",
      errRequired: "Client, course and name are all required.",
      errFailed: "Couldn't create it, please try again",
    },
    del: {
      button: "Delete",
      confirmTitle: "Delete notebook",
      confirmMessage:
        "Delete \"{name}\"? The client will lose access to it immediately.",
      confirmText: "Delete",
      failed: "Couldn't delete, please try again",
    },
    backToList: "Back to notebooks",
    pagesHeading: "Pages",
    openTree: "Pages",
    closeTree: "Close pages",
    noSelection: "Pick a page on the left to start.",
    treeEmpty: "This notebook has no pages yet.",
    untitled: "Untitled page",
    expand: "Expand",
    collapse: "Collapse",
    addChild: "Add sub-page",
    addChildFailed: "Couldn't add the sub-page",
    rename: "Rename",
    renameTitle: "Rename page",
    renameMessage: "Enter a new page name",
    renameFailed: "Couldn't rename it",
    moveTo: "Move to…",
    moveTitle: "Move page",
    moveHint: "Pick a new parent for \"{name}\" — its sub-pages move with it.",
    moveCurrentParent: "Current",
    moveNoTarget: "Nowhere to move it to.",
    moveFailed: "Couldn't move it",
    deletePage: "Delete page",
    deleteTitle: "Delete page",
    deleteMessage: "Delete \"{name}\"? Every sub-page under it goes too.",
    deleteConfirm: "Delete",
    deleteFailed: "Couldn't delete it",
    titlePlaceholder: "Untitled page",
    editorLoading: "Loading editor…",
    saveDirty: "Unsaved",
    saving: "Saving…",
    saved: "Saved",
    saveFailed: "Save failed",
    saveConflict: "Conflict",
    conflictBody:
      "The other side updated this page, so your latest edits weren't saved. Reload to continue from their version.",
    conflictReload: "Reload",
    dbAddCard: "Add sub-page",
    dbEmpty: "No sub-pages yet — use \"+ New\" at the bottom of any column.",
    typePage: "Page",
    typeDatabase: "Board",
    board: {
      uncategorized: "No category",
      addCard: "New",
      columnEmpty: "No cards in this column",
      manageCategories: "Categories",
      dragHint: "Drag a card to change its category",
      dragHintMobile: "Use ⋯ on a card to change category",
      moveTo: "Move to category…",
      moveHint: "Which category should \"{name}\" go to?",
      moveFailed: "Couldn't move the card, please try again",
      updatedAt: "Updated ",
    },
    cat: {
      title: "Manage categories",
      hint: "Categories are the board's columns, left to right. Changes apply once you hit Save.",
      namePlaceholder: "Category name, e.g. Block 1",
      unnamed: "Untitled category",
      add: "Add category",
      color: "Pick a colour",
      moveLeft: "Move left",
      moveRight: "Move right",
      remove: "Delete category",
      removeConfirmTitle: "Delete category",
      removeConfirmMessage:
        "Delete the category \"{name}\"? Its cards aren't deleted — they all move to \"No category\".",
      removeConfirmText: "Delete",
      save: "Save",
      saving: "Saving…",
      cancel: "Cancel",
      empty: "No categories yet — every card sits in \"No category\".",
      nameRequired: "Category names can't be blank.",
      saveFailed: "Couldn't save the categories, please try again",
      limitReached: "Category limit reached",
    },
    slash: {
      group: "Notebook",
      subPageTitle: "Sub-page",
      subPageSubtext: "Create a page and link to it here",
      databaseTitle: "Database",
      databaseSubtext: "Create a category board and link to it",
    },
    pageLink: {
      open: "Open page",
      deleted: "Deleted page",
      badgeDatabase: "Database",
    },
  },
};

export const memberExtra: {
  zhTW: MemberExtraTranslations;
  en: MemberExtraTranslations;
} = {
  zhTW,
  en,
};
