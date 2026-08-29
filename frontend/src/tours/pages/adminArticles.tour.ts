/**
 * 文章管理（/admin/articles）導覽
 * @module tours/pages/adminArticles.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-articles",
  title: "文章管理導覽",

  groups: {
    /** 「快速新增」彈窗——導覽會自動按下按鈕開啟，走完自動關閉 */
    quickForm: {
      open: '[data-tour="articles-quick-add"]',
      wait: '[data-tour-modal="article-quick"]',
      close: '[data-tour="article-form-cancel"]',
    },
  },

  steps: [
    {
      title: "文章管理",
      desc: "網站上所有<b>部落格文章</b>都在這一頁：新增、搜尋、設精選、改狀態。<br>接下來帶你走一遍，隨時可以按右上角 × 離開。",
    },
    {
      el: '[data-tour="articles-full-editor"]',
      title: "新增文章（完整版）",
      desc: "要正式寫一篇文章，從這裡進<b>全螢幕編輯器</b>——有封面圖、Banner、標籤與圖文排版，草稿還會自動暫存。",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="articles-quick-add"]',
      title: "快速新增",
      desc: "只是想先<em>把題目記下來</em>、之後再寫？用快速新增填個標題就能先存成草稿。<br>下一步會直接幫你打開它。",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在「快速新增」彈窗內 ──
    {
      group: "quickForm",
      el: '[data-tour="article-form-title"]',
      title: "文章標題",
      desc: "唯一的必填欄位。下面的<b>網址識別碼留空會自動產生</b>，沒有 SEO 上的特別考量就別動它。",
      side: "bottom",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="article-form-content"]',
      title: "文章內容",
      desc: "圖文編輯器，可以排版、插圖、加影片。<br>工具列的<b>插圖</b>按鈕支援兩種來源：直接<em>上傳圖片</em>，或貼上 <em>Cloudinary 網址</em>。",
      side: "top",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="article-form-status"]',
      title: "狀態與精選",
      desc: "<b>草稿</b>只有你看得到、<b>發布</b>會出現在前台文章列表。勾<b>設為精選</b>會被推到首頁與列表最前面，建議只留 2～3 篇。<br>填完按右下角<b>建立</b>存檔。",
      side: "top",
      align: "start",
    },

    // ── 回到列表 ──
    {
      el: '[data-tour="articles-search"]',
      title: "搜尋文章",
      desc: "輸入關鍵字後按 <code>Enter</code>（或右邊的搜尋鈕）向後端查詢；清空欄位會自動回到完整列表。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="articles-status-filter"]',
      title: "三組篩選器",
      desc: "由左到右是<b>狀態</b>、<b>分類</b>、<b>精選</b>。想把沒寫完的補完就選「草稿」；想檢查首頁推薦是否過多就選「僅精選」。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="articles-table"]',
      title: "文章列表",
      desc: "點<b>★／☆</b>就能直接切換精選，不用進編輯器。右邊三個動作：<b>編輯</b>進完整編輯器、<b>快速編輯</b>開剛才那個彈窗、<b>刪除</b>會再問一次。<br>點欄位標題可排序；右上角可切成圖卡檢視檢查封面圖。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "左側可以切換到其他管理頁。<b>每一頁的右下角都有這顆「?」</b>，需要時再按一次就好。",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>左上角的選單鈕可以叫出各個管理頁。<b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
