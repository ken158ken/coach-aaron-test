/**
 * 用戶管理（/admin/users）導覽
 * @module tours/pages/adminUsers.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-users",
  title: "用戶管理導覽",
  titleEn: "User management tour",

  groups: {
    /** 「用戶詳情」彈窗——導覽會自動點列表上的「查看」開啟 */
    detail: {
      open: '[data-tour="users-view-btn"]',
      wait: '[data-tour-modal="user-detail"]',
      // Dialog 版 Modal 沒有 × 鈕 → 省略 close，引擎改送 Escape
    },
    /** 「編輯用戶」彈窗——導覽會自動點列表上的「編輯」開啟 */
    editForm: {
      open: '[data-tour="users-edit-btn"]',
      wait: '[data-tour-modal="user-edit"]',
    },
  },

  steps: [
    {
      title: "用戶管理",
      desc: "所有<b>註冊過的學員</b>都在這一頁：查資料、改狀態、決定他能看到哪些課程售價。<br>接下來帶你走一遍，隨時可以按右上角 × 離開。",
      titleEn: "User management",
      descEn: "Every <b>registered student</b> is on this page: look up records, change status, and decide which course prices they get to see.<br>Here's a walkthrough — leave any time with the × in the top-right corner.",
    },
    {
      el: '[data-tour="users-search"]',
      title: "找人最快的方式",
      desc: "輸入姓名或信箱的<b>任一片段</b>即時過濾，不用按 Enter。<br>注意它只搜<em>目前這一頁</em>的資料，找不到人就先翻下一頁。",
      titleEn: "Find someone fast",
      descEn: "Type <b>any fragment</b> of a name or email and the list filters as you go — no Enter needed.<br>It only searches <em>the page you're on</em>, so if someone doesn't turn up, try the next page.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="users-role-filter"]',
      title: "角色與狀態篩選",
      desc: "左邊挑<b>管理員／一般用戶</b>，右邊挑<b>活躍／停用</b>。<br>兩個一起用最實用的情境：稽核「還有誰是管理員」。",
      titleEn: "Filter by role and status",
      descEn: "Pick <b>admin or regular user</b> on the left, <b>active or disabled</b> on the right.<br>The most useful combination: auditing who still holds admin rights.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="users-view-toggle"]',
      title: "切換檢視方式",
      desc: "清單適合<b>比對資料</b>（有信箱、建立日期、排序）；小圖／中圖／大圖是頭像牆，適合<b>認人</b>。",
      titleEn: "Switch how the list looks",
      descEn: "List view is for <b>comparing records</b> — emails, join dates, sorting. The small, medium, and large grids are an avatar wall, better for <b>recognizing faces</b>.",
      side: "bottom",
      align: "end",
      only: "desktop",
    },
    {
      el: '[data-tour="users-table"]',
      title: "用戶列表",
      desc: "點<b>整列</b>任一處就能看詳情，右側另有「查看」與「編輯」。<br>點欄位標題可以排序，例如依建立日期找出最近註冊的人。<br>下一步會直接幫你打開詳情。",
      titleEn: "The user list",
      descEn: "Click <b>anywhere in a row</b> to open its details; View and Edit sit on the right as well.<br>Click a column header to sort — by join date, for instance, to catch the newest signups.<br>The next step opens the details for you.",
      side: "top",
      align: "start",
    },

    // ── 以下步驟在「用戶詳情」彈窗內 ──
    {
      group: "detail",
      el: '[data-tour="user-detail-fields"]',
      title: "用戶詳情",
      desc: "<b>用戶 ID</b> 是回報問題時最準確的識別依據，信箱可能重複輸入錯、ID 不會。<br>帳號狀態顯示<em>停用</em>時，這個人無法登入前台。",
      titleEn: "Inside a user's details",
      descEn: "The <b>user ID</b> is the safest thing to quote when reporting a problem — emails get mistyped, IDs don't.<br>When the account status reads <em>disabled</em>, that person cannot log into your public site.",
      side: "bottom",
      align: "start",
    },
    {
      group: "detail",
      el: '[data-tour="user-detail-price"]',
      title: "課程售價設定",
      desc: "可以<b>針對這一位</b>決定每門課要不要露出價格——談客製報價、企業合作時很有用。<br>裡面有「全部開啟／關閉」可一次搞定，改動<b>即時生效</b>、不用另外存檔。",
      titleEn: "Per-user course pricing",
      descEn: "Decide <b>for this one person</b> whether each course shows its price — useful for custom quotes and corporate deals.<br>There is an all-on / all-off switch inside, and changes take effect <b>immediately</b>, with nothing to save.",
      side: "top",
      align: "start",
    },

    // ── 以下步驟在「編輯用戶」彈窗內 ──
    {
      group: "editForm",
      el: '[data-tour="user-edit-name"]',
      title: "可以改的只有姓名",
      desc: "這裡改的是<b>顯示用的姓名</b>，通常只有在名字亂碼或空白時才需要動手。<br>下面的電子郵件是<b>登入帳號本身</b>，所以刻意鎖住不給改。",
      titleEn: "Only the name is editable",
      descEn: "This is the <b>display name</b>, usually worth touching only when it arrives blank or garbled.<br>The email below is <b>the login account itself</b>, so it is deliberately locked.",
      side: "bottom",
      align: "start",
    },
    {
      group: "editForm",
      el: '[data-tour="user-edit-submit"]',
      title: "儲存變更",
      desc: "改完按儲存才會寫回資料庫；直接按 <code>Esc</code> 或「取消」則不留痕跡。",
      titleEn: "Save your changes",
      descEn: "Nothing reaches the database until you press save; <code>Esc</code> or Cancel leaves no trace.",
      side: "top",
      align: "end",
    },

    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "想控制<b>誰能進這個後台</b>不是在這頁，而是左側的「白名單」。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "Tour complete",
      descEn: "Controlling <b>who can get into this admin</b> happens under Whitelist in the sidebar, not here.<br><b>Every page carries that ? in the bottom-right corner</b> — press it again whenever you need it.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>想控制<b>誰能進這個後台</b>不是在這頁，而是選單裡的「白名單」。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "Tour complete",
      descEn: "To reach another admin page, tap <b>the menu button in the top-left</b> and the full list slides out.<br>Controlling <b>who can get into this admin</b> happens under Whitelist in that menu, not here.<br><b>Every page carries that ? in the bottom-right corner</b> — press it again whenever you need it.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
