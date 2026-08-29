/**
 * Landing Page 管理（/admin/landing-pages）導覽
 * @module tours/pages/adminLandingPages.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-landing-pages",
  title: "Landing Page 管理導覽",
  titleEn: "Landing pages tour",

  steps: [
    {
      title: "Landing Page 管理",
      desc: "這裡放的是<b>活動用的單頁式行銷頁</b>——招生檔期、限時方案、報名說明都適合。<br>每一頁都從模板複製出來，改文字換圖就能上線。",
      titleEn: "Landing pages",
      descEn: "These are <b>single-page marketing pages for campaigns</b> — enrollment windows, limited-time offers, sign-up details.<br>Each one is copied from a template: change the words and the pictures and it is ready to go live.",
    },
    {
      el: '[data-tour="lp-add"]',
      title: "新增一個專案",
      desc: "點下去會進到<b>模板挑選頁</b>：先選版型、取好專案名稱，系統就會複製一份可編輯的內容給你。<br>原始模板不會被改到，放心試。",
      titleEn: "Start a new page",
      descEn: "This takes you to the <b>template picker</b>: choose a layout, name the project, and you get an editable copy of the content.<br>The original template is never touched, so try things freely.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="lp-search"]',
      title: "找專案",
      desc: "輸入關鍵字即時過濾，不用按 Enter。專案名稱、專案代碼、自訂網址三個欄位都會一起比對。",
      titleEn: "Find a page",
      descEn: "Type a keyword and the list filters as you go — no Enter needed. It matches the project name, the project code and the custom URL together.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="lp-status-filter"]',
      title: "依狀態篩選",
      desc: "檔期一多會很亂。想確認「哪些頁還沒發布」就切到<b>草稿</b>；活動結束的頁面建議改成<b>封存</b>，列表才不會被舊檔期塞滿。",
      titleEn: "Filter by status",
      descEn: "Campaigns pile up fast. Switch to <b>Draft</b> to see what is still unpublished, and move finished campaigns to <b>Archived</b> so old pages stop crowding the list.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="lp-grid"]',
      title: "專案卡片",
      desc: "縮圖左上角的色塊就是狀態，右上角是它用的模板代號。下方會顯示公開網址（<code>/你的網址</code>）與最後更新時間，方便一眼確認哪頁最近動過。",
      titleEn: "The project cards",
      descEn: "The color block at the top left of the thumbnail is the status; the code at the top right is the template it uses. Underneath sit the public URL (<code>/your-url</code>) and the last-updated time, so you can see at a glance which page moved recently.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="lp-card-actions"]',
      title: "每張卡片的四個動作",
      desc: "<b>編輯</b>進全螢幕編輯器改內容；<b>預覽</b>另開分頁看實際效果（發布後才會出現）；<b>發布／下架</b>一鍵切換對外開關；<b>刪除</b>會再問一次，而且<em>無法復原</em>。",
      titleEn: "Four actions per card",
      descEn: "<b>Edit</b> opens the full-screen editor; <b>Preview</b> shows the real page in a new tab (it appears only after publishing); <b>Publish / Unpublish</b> flips the page on and off in one click; <b>Delete</b> asks once, and <em>cannot be undone</em>.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "左側可以切換到其他管理頁。<b>每一頁的右下角都有這顆「?」</b>，包含 Landing Page 的模板挑選頁與編輯器，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "The sidebar switches you to any other admin page. <b>Every page has a “?” in the bottom-right corner</b> — the template picker and the editor included — press it whenever you want the tour again.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>左上角的選單鈕可以叫出各個管理頁。<b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "To move to another admin page, tap the <b>menu button in the top-left</b> for the full list.<br>It brings up every admin page there is. <b>Every page has a “?” in the bottom-right corner</b> — tap it whenever you want the tour again.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
