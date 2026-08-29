/**
 * 白名單管理（/admin/whitelist）導覽
 * @module tours/pages/adminWhitelist.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-whitelist",
  title: "白名單管理導覽",

  groups: {
    /** 「新增白名單」彈窗——自訂彈窗，沒有監聽 Escape，所以指定「取消」當關閉鈕 */
    addForm: {
      open: '[data-tour="whitelist-add"]',
      wait: '[data-tour-modal="whitelist-add"]',
      close: '[data-tour="whitelist-form-cancel"]',
    },
  },

  steps: [
    {
      title: "白名單管理",
      desc: "這一頁決定<b>誰能登入這個後台</b>。名單外的人就算 Google 登入成功，也進不來。<br>接下來帶你走一遍，隨時可以按右上角 × 離開。",
    },
    {
      el: '[data-tour="whitelist-add"]',
      title: "把人加進來",
      desc: "要讓新同事能管理網站，第一步就是在這裡登記他的 Email。<br>下一步會直接幫你打開表單。",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在「新增白名單」彈窗內 ──
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-email"]',
      title: "Email（唯一必填）",
      desc: "必須跟他<b>登入時用的 Google 帳號完全一致</b>，大小寫、有沒有加點都算。填錯不會報錯，只會登不進來。",
      side: "bottom",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-name"]',
      title: "顯示名稱（客戶看得到）",
      desc: "聊天室裡<em>客戶那一端</em>看到的稱呼，例如「Aaron 教練」。<br>留空的話客戶只會看到系統預設名稱，建議一定要填。",
      side: "bottom",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-note"]',
      title: "內部備註",
      desc: "只有管理員看得到。寫清楚<b>這個人是誰、為什麼給權限</b>，半年後要清名單時你會感謝自己。",
      side: "top",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-submit"]',
      title: "送出",
      desc: "按下去就寫入名單，對方<b>下次登入即刻生效</b>，不用等。",
      side: "top",
      align: "end",
    },

    // ── 回到列表 ──
    {
      el: '[data-tour="whitelist-table"]',
      title: "名單列表",
      desc: "<b>顯示名稱</b>與<b>備註</b>兩欄可以直接點下去改，不用另外進編輯。<br>最右邊的「刪除」會先跳確認視窗，不會手滑就刪掉。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="whitelist-permission-col"]',
      title: "後台權限開關",
      desc: "這個開關是<b>即時生效</b>的：關掉的人立刻進不了後台，但資料還留著，之後可以再打開。<br><em>千萬別關掉自己那一列</em>——關了就得請工程師去資料庫救。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "白名單管的是<b>後台權限</b>；一般學員的資料在左側「用戶」那一頁。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "白名單管的是<b>後台權限</b>；一般學員的資料在選單裡的「用戶」那一頁。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      only: "mobile",
    },
  ],
};

export default tour;
