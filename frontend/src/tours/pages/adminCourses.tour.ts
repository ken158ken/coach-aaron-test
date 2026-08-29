/**
 * 課程管理（/admin/courses）導覽
 * @module tours/pages/adminCourses.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-courses",
  title: "課程管理導覽",

  groups: {
    /** 「快速新增」彈窗——導覽會自動按下按鈕開啟，走完自動關閉 */
    quickForm: {
      open: '[data-tour="courses-quick-add"]',
      wait: '[data-tour-modal="course-quick"]',
      close: '[data-tour-modal="course-quick"] [data-tour-modal-close]',
    },
  },

  steps: [
    {
      title: "課程管理",
      desc: "這裡是所有<b>單堂課程</b>的總表：新增、搜尋、改狀態、排課堂數都在這一頁。<br>接下來帶你走一遍，隨時可以按右上角 × 離開。",
    },
    {
      el: '[data-tour="courses-full-editor"]',
      title: "新增課程（完整版）",
      desc: "要做一門<b>正式上架</b>的課，從這裡進完整編輯器——有封面圖、Banner、SEO 設定與圖文內容。",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="courses-quick-add"]',
      title: "快速新增",
      desc: "只想先<em>佔個位子</em>、之後再補內容？用快速新增，填名稱與價格就能先存成草稿。<br>下一步會直接幫你打開它。",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在「快速新增」彈窗內 ──
    {
      group: "quickForm",
      el: '[data-tour="course-form-title"]',
      title: "課程名稱",
      desc: "唯一的必填欄位。取名以學員看得懂為準，例如「一對一體態評估」。",
      side: "bottom",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="course-form-slug"]',
      title: "網址識別碼",
      desc: "課程頁網址的尾巴。<b>留空會自動產生</b>，除非你有 SEO 上的特別考量，否則不用動它。",
      side: "bottom",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="course-form-price"]',
      title: "價格與難度",
      desc: "價格填數字就好（單位新台幣），前台會自動加上千分位。右邊選難度，會顯示在課程卡片上。",
      side: "bottom",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="course-form-category"]',
      title: "分類與關鍵字",
      desc: "打字後按 <code>Enter</code> 就變成一個標籤。<b>分類</b>會成為前台的篩選選項；<b>關鍵字</b>只給搜尋引擎看，不會顯示在頁面上。",
      side: "bottom",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="course-form-content"]',
      title: "課程詳細內容",
      desc: "圖文編輯器，可以排版、插圖、加影片。<br>工具列的<b>插圖</b>按鈕支援兩種來源：直接<em>上傳圖片</em>，或貼上 <em>Cloudinary 網址</em>。",
      side: "top",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="course-form-status"]',
      title: "發布狀態",
      desc: "<b>草稿</b>只有你看得到、<b>發布</b>會出現在前台課程列表、<b>封存</b>則是下架但保留資料。<br>沒把握就先留草稿。",
      side: "top",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="course-form-submit"]',
      title: "建立課程",
      desc: "按下去就存檔。之後想補封面圖或詳細內容，回列表點<b>編輯</b>進完整編輯器即可。",
      side: "top",
      align: "end",
    },

    // ── 回到列表 ──
    {
      el: '[data-tour="courses-search"]',
      title: "搜尋課程",
      desc: "輸入關鍵字即時過濾課程名稱，不用按 Enter。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="courses-status-filter"]',
      title: "狀態與分類篩選",
      desc: "想只看「草稿」把未完成的補完？或只看某個分類？用這兩個下拉選單過濾。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="courses-view-toggle"]',
      title: "切換檢視方式",
      desc: "清單適合<b>快速改狀態</b>；小圖／中圖／大圖適合<b>檢查封面</b>是否都設好了。",
      side: "bottom",
      align: "end",
      only: "desktop",
    },
    {
      el: '[data-tour="courses-table"]',
      title: "課程列表",
      desc: "每一列右邊有三個動作：<b>編輯</b>進完整編輯器、<b>快速編輯</b>開剛才那個彈窗、<b>刪除</b>會再問一次才動手。<br>點欄位標題可以排序。",
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
      desc: "左上角的選單鈕可以叫出各個管理頁。<b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      only: "mobile",
    },
  ],
};

export default tour;
