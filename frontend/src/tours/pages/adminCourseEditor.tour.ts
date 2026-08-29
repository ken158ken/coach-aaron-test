/**
 * 課程編輯器（/admin/courses/new、/admin/courses/:id/edit）導覽
 * @module tours/pages/adminCourseEditor.tour
 *
 * @description
 * 同一份步驟同時服務「新增課程」與「編輯課程」，文案不假設有沒有既有內容。
 * 這頁是獨立全頁編輯器（不在 AdminLayout 之下），因此不引用側邊欄錨點，
 * 「?」鈕由頁面自己掛的 `<HelpTourButton />` 提供。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-course-editor",
  title: "課程編輯器導覽",

  groups: {
    /**
     * 工具列「插圖」鈕開的圖片彈窗。開不起來會整組安靜跳過，
     * 所以就算之後工具列改版也不會弄壞導覽。
     */
    insertImage: {
      open: '[data-tour="editor-insert-image"]',
      wait: '[data-tour-modal="image-picker"]',
      close: '[data-tour-modal="image-picker"] [data-tour-modal-close]',
    },
  },

  steps: [
    {
      title: "課程編輯器",
      desc: "這裡是課程的<b>完整編輯頁</b>：左邊寫課程介紹、右邊設定價格與圖片。<br>新開一門課或回來改舊的都走同一套流程，內容每 30 秒自動暫存在瀏覽器。",
    },
    {
      el: '[data-tour="course-editor-title"]',
      title: "先給它一個課名",
      desc: "標題是<b>唯一必填</b>的欄位，沒填不能發布。以學員看得懂為準，例如「一對一體態評估」會比「課程 A」好賣。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="editor-toolbar"]',
      title: "課程內容工具列",
      desc: "像 Word 一樣選取文字再按 <b>B / I / U</b> 或標題大小。右段是媒體——<em>🖼️ 插圖</em>、<em>🏞️ 圖片庫</em>、<em>🎬 YouTube</em>、<em>🔗 連結</em>，嵌一段示範影片能大幅提高報名意願。<br>下一步直接示範插圖。",
      side: "bottom",
      align: "start",
    },
    {
      group: "insertImage",
      el: '[data-tour-modal="image-picker"] [data-tour="image-input-tabs"]',
      title: "插圖也是雙來源",
      desc: "按下<b>🖼️</b> 就會開這個彈窗，兩個頁籤和右邊的封面圖完全一樣：<b>上傳圖片</b>直接從電腦拉檔案，<b>Cloudinary 網址</b>貼現成連結。選好按「插入」就會放進游標所在的位置。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-slug"]',
      title: "網址代稱",
      desc: "課程頁網址的尾巴，例如 <code>/courses/beginner-training</code>。只收小寫英數與 <code>-</code>，<b>留空會自動產生</b>；撞名的話下方會馬上跳紅字提醒。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-category"]',
      title: "分類與標籤",
      desc: "分類是前台<b>篩選課程</b>用的，不夠用就按<b>管理分類</b>自己加。下面的標籤打完按 <code>Enter</code> 新增，主要餵給搜尋引擎。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="image-input-tab-upload"]',
      title: "封面圖 ①：上傳圖片",
      desc: "這是新的上傳模式——把圖片<b>拖進虛線框</b>或點一下選檔案就好，系統會自動壓成 WebP。限 <b>5MB</b> 內的 JPG / PNG / WebP / GIF / AVIF。<br>下面的 <em>Banner 大圖</em> 用法完全相同。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="image-input-tab-url"]',
      title: "封面圖 ②：Cloudinary 網址",
      desc: "已經把圖放在 Cloudinary？切到這個頁籤把網址貼上再按「套用」即可。<b>網址必須是 <code>res.cloudinary.com</code> 開頭</b>，貼錯會當場擋下來，發布前也會再驗一次。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-price"]',
      title: "價格、時長與難度",
      desc: "價格<b>填數字就好</b>（單位新台幣），前台會自動加千分位；時長可以寫「60 分鐘」或「8 週課程」。往下的<b>難度等級</b>會顯示在課程卡片上，幫學員自己對號入座。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-actions"]',
      title: "存檔與發布",
      desc: "<b>儲存草稿</b>只存進你這台瀏覽器（換電腦看不到）；按<b>發布課程</b>才會真的寫進資料庫並上架到前台。<br>導覽結束——右下角的<b>「?」</b>隨時可以再看一次。",
      side: "bottom",
      align: "end",
    },
  ],
};

export default tour;
