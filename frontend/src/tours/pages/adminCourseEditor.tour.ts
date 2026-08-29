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
  titleEn: "Course editor tour",

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
      titleEn: "Course editor",
      descEn: "The <b>full editing page</b> for a course: write the description on the left, set price and images on the right.<br>A brand-new course and an old one follow the same flow, and your work is auto-saved in the browser every 30 seconds.",
    },
    {
      el: '[data-tour="course-editor-title"]',
      title: "先給它一個課名",
      desc: "標題是<b>唯一必填</b>的欄位，沒填不能發布。以學員看得懂為準，例如「一對一體態評估」會比「課程 A」好賣。",
      titleEn: "Name the course first",
      descEn: "The title is the <b>only required field</b> — without it you cannot publish. Write it the way a student would say it: One-on-one Posture Assessment sells better than Course A.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="editor-toolbar"]',
      title: "課程內容工具列",
      desc: "像 Word 一樣選取文字再按 <b>B / I / U</b> 或標題大小。右段是媒體——<em>🖼️ 插圖</em>、<em>🏞️ 圖片庫</em>、<em>🎬 YouTube</em>、<em>🔗 連結</em>，嵌一段示範影片能大幅提高報名意願。<br>下一步直接示範插圖。",
      titleEn: "The content toolbar",
      descEn: "Works like Word: select the text, then hit <b>B / I / U</b> or a heading size. The right-hand group is media — <em>🖼️ image</em>, <em>🏞️ library</em>, <em>🎬 YouTube</em>, <em>🔗 link</em> — and embedding a short demo video lifts sign-ups a lot.<br>The next step demonstrates inserting an image.",
      side: "bottom",
      align: "start",
    },
    {
      group: "insertImage",
      el: '[data-tour-modal="image-picker"] [data-tour="image-input-tabs"]',
      title: "插圖也是雙來源",
      desc: "按下<b>🖼️</b> 就會開這個彈窗，兩個頁籤和右邊的封面圖完全一樣：<b>上傳圖片</b>直接從電腦拉檔案，<b>Cloudinary 網址</b>貼現成連結。選好按「插入」就會放進游標所在的位置。",
      titleEn: "Two sources here too",
      descEn: "The <b>🖼️</b> button opens this dialog, and its two tabs match the cover image on the right: <b>Upload</b> pulls a file straight from your computer, <b>Cloudinary URL</b> takes a link you already have. Choose one, press Insert, and it drops in at the cursor.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-slug"]',
      title: "網址代稱",
      desc: "課程頁網址的尾巴，例如 <code>/courses/beginner-training</code>。只收小寫英數與 <code>-</code>，<b>留空會自動產生</b>；撞名的話下方會馬上跳紅字提醒。",
      titleEn: "URL slug",
      descEn: "The tail of the course page address, such as <code>/courses/beginner-training</code>. Lowercase letters, numbers and <code>-</code> only; <b>leave it blank and one is generated</b>. A clash turns red right below the field.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-category"]',
      title: "分類與標籤",
      desc: "分類是前台<b>篩選課程</b>用的，不夠用就按<b>管理分類</b>自己加。下面的標籤打完按 <code>Enter</code> 新增，主要餵給搜尋引擎。",
      titleEn: "Category and tags",
      descEn: "Categories are what visitors <b>filter courses</b> by on your public site; press <b>Manage categories</b> to add your own. Tags below are added with <code>Enter</code> and mainly feed search engines.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="image-input-tab-upload"]',
      title: "封面圖 ①：上傳圖片",
      desc: "這是新的上傳模式——把圖片<b>拖進虛線框</b>或點一下選檔案就好，系統會自動壓成 WebP。限 <b>5MB</b> 內的 JPG / PNG / WebP / GIF / AVIF。<br>下面的 <em>Banner 大圖</em> 用法完全相同。",
      titleEn: "Cover image 1: upload a file",
      descEn: "The new upload mode — <b>drop the image on the dashed box</b> or click to browse, and it is converted to WebP for you. JPG / PNG / WebP / GIF / AVIF up to <b>5MB</b>.<br>The <em>banner image</em> further down works exactly the same way.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="image-input-tab-url"]',
      title: "封面圖 ②：Cloudinary 網址",
      desc: "已經把圖放在 Cloudinary？切到這個頁籤把網址貼上再按「套用」即可。<b>網址必須是 <code>res.cloudinary.com</code> 開頭</b>，貼錯會當場擋下來，發布前也會再驗一次。",
      titleEn: "Cover image 2: Cloudinary URL",
      descEn: "Already hosting the picture on Cloudinary? Switch to this tab, paste the link and press Apply. <b>The URL must start with <code>res.cloudinary.com</code></b> — anything else is rejected on the spot, and checked once more before publishing.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-price"]',
      title: "價格、時長與難度",
      desc: "價格<b>填數字就好</b>（單位新台幣），前台會自動加千分位；時長可以寫「60 分鐘」或「8 週課程」。往下的<b>難度等級</b>會顯示在課程卡片上，幫學員自己對號入座。",
      titleEn: "Price, length and level",
      descEn: "Price takes <b>numbers only</b> (in NT dollars) and your public site adds the thousands separator. Length can read 60 minutes or 8 weeks. The <b>difficulty level</b> further down shows on the course card and helps students place themselves.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="course-editor-actions"]',
      title: "存檔與發布",
      desc: "<b>儲存草稿</b>只存進你這台瀏覽器（換電腦看不到）；按<b>發布課程</b>才會真的寫進資料庫並上架到前台。<br>導覽結束——右下角的<b>「?」</b>隨時可以再看一次。",
      titleEn: "Save and publish",
      descEn: "<b>Save draft</b> stores it in this browser only — another computer will not see it. <b>Publish course</b> is what writes it to the database and puts it live on your public site.<br>That is the tour — the <b>“?”</b> in the bottom-right corner replays it any time.",
      side: "bottom",
      align: "end",
    },
  ],
};

export default tour;
