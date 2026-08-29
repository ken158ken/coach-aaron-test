/**
 * 匯出中心（/admin/export）導覽
 * @module tours/pages/adminExport.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-export",
  title: "匯出中心導覽",
  titleEn: "Export center tour",

  steps: [
    {
      title: "匯出中心",
      desc: "把後台資料變成一份可以<b>寄出、列印或存檔</b>的檔案就用這一頁。<br>順序很簡單：先選格式，再決定要一個模組還是整站。",
      titleEn: "Export center",
      descEn: "Use this page to turn admin data into a file you can <b>send, print or archive</b>.<br>The order is simple: pick the format first, then decide between one module and the whole site.",
    },
    {
      el: '[data-tour="export-format"]',
      title: "先選格式，再按匯出",
      desc: "這裡選的格式<b>套用到本頁所有匯出按鈕</b>，所以一定要先選。<br>要再排序篩選就用 <em>Excel</em>；要給人看或列印用 <em>Word</em>／<em>網頁</em>；只是留一份純資料備份，<code>md</code> 或 <code>txt</code> 最輕。",
      titleEn: "Pick the format first",
      descEn: "The format chosen here <b>applies to every export button on this page</b>, so set it before anything else.<br>Use <em>Excel</em> if you still need to sort and filter, <em>Word</em> or <em>web page</em> if someone will read or print it, and <code>md</code> or <code>txt</code> for the lightest plain-data backup.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="export-modules"]',
      title: "分模組匯出",
      desc: "每張卡片是一份獨立資料，卡片上的小字寫明<b>會匯出哪些欄位</b>，按之前先掃一眼比較保險。<br>只想給會計看預約記錄、或只要一份會員名單時，用這裡比整站匯出乾淨得多。",
      titleEn: "Export one module",
      descEn: "Each card is a separate data set, and its small print says <b>which fields come out</b> — worth a glance before you click.<br>When the accountant only needs bookings, or you just want a user list, this is far cleaner than a full export.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="export-module-btn"]',
      title: "按下去就直接下載",
      desc: "不會跳到別的頁面，檔案<b>直接存到瀏覽器的下載資料夾</b>，檔名由系統帶好日期。<br>匯出期間其他按鈕會暫時鎖住，這是刻意的——避免同時打好幾份造成伺服器負擔。",
      titleEn: "One click, straight to downloads",
      descEn: "No new page opens — the file <b>goes to your browser's download folder</b> with the date already in its name.<br>The other buttons lock while an export runs. That is deliberate: several jobs at once would strain the server.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="export-full"]',
      title: "一次帶走整站",
      desc: "要做<b>整體備份</b>或交接給別人時用這顆。選 Excel 的話會產生<b>多 Sheet</b> 的單一檔案，每個模組一張工作表，不會散成十幾個檔。<br>資料多時會跑比較久，按一次等它跑完就好。",
      titleEn: "Take the whole site at once",
      descEn: "Use this for a <b>full backup</b> or when handing the site to someone else. With Excel you get one <b>multi-sheet</b> file, a sheet per module, instead of a dozen loose files.<br>A lot of data takes a while — click once and let it finish.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "匯出的內容是<b>按下當下</b>的資料快照，不會自動更新，需要最新版就重跑一次。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "An export is a snapshot of the data <b>at the moment you clicked</b>. It never updates itself, so run it again when you need the latest.<br><b>Every page has a “?” in the bottom-right corner</b> — press it whenever you want the tour again.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>匯出的內容是<b>按下當下</b>的資料快照，不會自動更新，需要最新版就重跑一次。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "To move to another admin page, tap the <b>menu button in the top-left</b> for the full list.<br>An export is a snapshot of the data <b>at the moment you clicked</b>, so run it again when you need the latest.<br><b>Every page has a “?” in the bottom-right corner</b> — tap it whenever you want the tour again.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
