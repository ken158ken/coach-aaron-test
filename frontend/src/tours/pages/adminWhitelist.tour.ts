/**
 * 白名單管理（/admin/whitelist）導覽
 * @module tours/pages/adminWhitelist.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-whitelist",
  title: "白名單管理導覽",
  titleEn: "Whitelist tour",

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
      titleEn: "Whitelist",
      descEn: "This page decides <b>who can log into this admin</b>. Anyone off the list is turned away even after a successful Google sign-in.<br>Here's a walkthrough — leave any time with the × in the top-right corner.",
    },
    {
      el: '[data-tour="whitelist-add"]',
      title: "把人加進來",
      desc: "要讓新同事能管理網站，第一步就是在這裡登記他的 Email。<br>下一步會直接幫你打開表單。",
      titleEn: "Add someone",
      descEn: "Getting a new colleague onto the site starts here: register the email they use.<br>The next step opens the form for you.",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在「新增白名單」彈窗內 ──
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-email"]',
      title: "Email（唯一必填）",
      desc: "必須跟他<b>登入時用的 Google 帳號完全一致</b>，大小寫、有沒有加點都算。填錯不會報錯，只會登不進來。",
      titleEn: "Email (the only must)",
      descEn: "It has to match <b>the exact Google account they sign in with</b> — capitalization and any dots included. A typo raises no error; they simply can't get in.",
      side: "bottom",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-name"]',
      title: "顯示名稱（客戶看得到）",
      desc: "聊天室裡<em>客戶那一端</em>看到的稱呼，例如「Aaron 教練」。<br>留空的話客戶只會看到系統預設名稱，建議一定要填。",
      titleEn: "Display name (clients see it)",
      descEn: "What <em>the client's side</em> of the chat calls this person — Coach Aaron, for instance.<br>Leave it blank and clients see a generic system name, so it is worth filling in.",
      side: "bottom",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-note"]',
      title: "內部備註",
      desc: "只有管理員看得到。寫清楚<b>這個人是誰、為什麼給權限</b>，半年後要清名單時你會感謝自己。",
      titleEn: "Internal note",
      descEn: "Admins only. Spell out <b>who this person is and why they have access</b> — you will thank yourself when you clean up the list six months from now.",
      side: "top",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="whitelist-form-submit"]',
      title: "送出",
      desc: "按下去就寫入名單，對方<b>下次登入即刻生效</b>，不用等。",
      titleEn: "Submit",
      descEn: "This writes them into the list, and it <b>takes effect at their next login</b>, with no waiting.",
      side: "top",
      align: "end",
    },

    // ── 回到列表 ──
    {
      el: '[data-tour="whitelist-table"]',
      title: "名單列表",
      desc: "<b>顯示名稱</b>與<b>備註</b>兩欄可以直接點下去改，不用另外進編輯。<br>最右邊的「刪除」會先跳確認視窗，不會手滑就刪掉。",
      titleEn: "The list",
      descEn: "<b>Display name</b> and <b>note</b> can be edited right in the table — no separate edit screen.<br>Delete on the far right asks for confirmation, so a slip of the finger won't remove anyone.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="whitelist-permission-col"]',
      // 手機版是卡片排版、沒有表頭，改指列上的開關本身
      elMobile: '[data-tour="whitelist-permission-toggle"]',
      title: "後台權限開關",
      desc: "這個開關是<b>即時生效</b>的：關掉的人立刻進不了後台，但資料還留著，之後可以再打開。<br><em>千萬別關掉自己那一列</em>——關了就得請工程師去資料庫救。",
      titleEn: "The admin access toggle",
      descEn: "This switch is <b>instant</b>: turn it off and that person is locked out immediately, though the record stays and can be switched back on.<br><em>Never turn off your own row</em> — undoing that takes a developer and a database.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "白名單管的是<b>後台權限</b>；一般學員的資料在左側「用戶」那一頁。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "Tour complete",
      descEn: "The whitelist governs <b>admin access</b>; records for regular students live on the Users page in the sidebar.<br><b>Every page carries that ? in the bottom-right corner</b> — press it again whenever you need it.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>白名單管的是<b>後台權限</b>；一般學員的資料在選單裡的「用戶」那一頁。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "Tour complete",
      descEn: "To reach another admin page, tap <b>the menu button in the top-left</b> and the full list slides out.<br>The whitelist governs <b>admin access</b>; records for regular students live on the Users page in that menu.<br><b>Every page carries that ? in the bottom-right corner</b> — press it again whenever you need it.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
