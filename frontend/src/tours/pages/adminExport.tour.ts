/**
 * 匯出中心（/admin/export）導覽
 * @module tours/pages/adminExport.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-export",
  title: "匯出中心導覽",

  steps: [
    {
      title: "匯出中心",
      desc: "把後台資料變成一份可以<b>寄出、列印或存檔</b>的檔案就用這一頁。<br>順序很簡單：先選格式，再決定要一個模組還是整站。",
    },
    {
      el: '[data-tour="export-format"]',
      title: "先選格式，再按匯出",
      desc: "這裡選的格式<b>套用到本頁所有匯出按鈕</b>，所以一定要先選。<br>要再排序篩選就用 <em>Excel</em>；要給人看或列印用 <em>Word</em>／<em>網頁</em>；只是留一份純資料備份，<code>md</code> 或 <code>txt</code> 最輕。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="export-modules"]',
      title: "分模組匯出",
      desc: "每張卡片是一份獨立資料，卡片上的小字寫明<b>會匯出哪些欄位</b>，按之前先掃一眼比較保險。<br>只想給會計看預約記錄、或只要一份會員名單時，用這裡比整站匯出乾淨得多。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="export-module-btn"]',
      title: "按下去就直接下載",
      desc: "不會跳到別的頁面，檔案<b>直接存到瀏覽器的下載資料夾</b>，檔名由系統帶好日期。<br>匯出期間其他按鈕會暫時鎖住，這是刻意的——避免同時打好幾份造成伺服器負擔。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="export-full"]',
      title: "一次帶走整站",
      desc: "要做<b>整體備份</b>或交接給別人時用這顆。選 Excel 的話會產生<b>多 Sheet</b> 的單一檔案，每個模組一張工作表，不會散成十幾個檔。<br>資料多時會跑比較久，按一次等它跑完就好。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "匯出的內容是<b>按下當下</b>的資料快照，不會自動更新，需要最新版就重跑一次。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>匯出的內容是<b>按下當下</b>的資料快照，不會自動更新，需要最新版就重跑一次。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
