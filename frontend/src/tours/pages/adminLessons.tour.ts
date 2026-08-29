/**
 * 教學影片管理（/admin/lessons）導覽
 * @module tours/pages/adminLessons.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-lessons",
  title: "教學影片管理導覽",
  titleEn: "Lesson management tour",

  groups: {
    /**
     * 新增／編輯教學影片彈窗——導覽會自動按「＋ 新增」開啟，走完自動關閉。
     * 這裡的 Modal 來自 `@/components/ui`（Dialog），沒有 × 鈕，引擎會送 Escape。
     */
    lessonForm: {
      open: '[data-tour="lessons-add"]',
      wait: '[data-tour-modal="lesson-form"]',
    },
  },

  steps: [
    {
      title: "教學影片管理",
      desc: "這裡管的是站上的<b>教學影片</b>，影片本體放在 <em>Loom</em>，這一頁只負責掛連結、補中文資訊與逐字稿。<br>接下來帶你走一遍，隨時可以按右上角 × 離開。",
      titleEn: "Lesson management",
      descEn: "This page runs the <b>lessons</b> on your site. The videos themselves live on <em>Loom</em>; here you attach the link, add the written details, and paste the transcript.<br>Here's a walkthrough — leave any time with the × in the top-right corner.",
    },
    {
      el: '[data-tour="lessons-add"]',
      title: "新增一支教學影片",
      desc: "先在 Loom 錄好或上傳好影片，再回來按這顆。<b>必填只有兩欄</b>：Loom 分享連結與標題，其他都能之後再補。<br>下一步直接幫你打開表單。",
      titleEn: "Add a lesson",
      descEn: "Record or upload to Loom first, then come back and press this. <b>Only two fields are required</b>: the Loom share link and a title — the rest can wait.<br>The next step opens the form for you.",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在新增／編輯彈窗內 ──
    {
      group: "lessonForm",
      el: '[data-tour="lesson-form-loom-url"]',
      title: "Loom 分享連結",
      desc: "貼 Loom 的 <code>share</code> 網址即可，系統會自己解析出影片 ID。<br>影片沒設成<b>可公開觀看</b>的話前台會播不出來，貼之前先確認一下權限。",
      titleEn: "The Loom share link",
      descEn: "Paste Loom's <code>share</code> URL and the video ID is parsed out for you.<br>If the video is not set to <b>publicly viewable</b>, it won't play on your public site — check the permission before you paste.",
      side: "bottom",
      align: "start",
    },
    {
      group: "lessonForm",
      el: '[data-tour="image-input-dropzone"]',
      title: "封面截圖：直接上傳",
      desc: "封面<b>留空也沒關係</b>，系統會自動抓 Loom 的預設縮圖。想換成更好看的畫面時，把圖<em>拖進這個框</em>或點一下選檔即可，上傳後自動壓成 WebP，單檔上限 <code>5MB</code>。",
      titleEn: "Cover: upload a file",
      descEn: "<b>An empty cover is fine</b> — Loom's own thumbnail is pulled in automatically. For a better-looking frame, <em>drag an image into this box</em> or click to browse; uploads are converted to WebP, <code>5MB</code> per file.",
      side: "top",
      align: "start",
    },
    {
      group: "lessonForm",
      el: '[data-tour="image-input-tab-url"]',
      title: "封面截圖：改用貼網址",
      desc: "圖片已經在線上時，切到這個頁籤直接貼網址，不必再上傳一次。<br>這一欄除了 <code>cloudinary</code> 網址，也<b>額外放行 Loom 自己的 CDN</b>（<code>cdn.loom.com</code>），所以你可以直接貼 Loom 縮圖網址。其他網域會被擋下。",
      titleEn: "Cover: paste a URL",
      descEn: "If the image is already online, switch to this tab and paste the URL rather than upload it again.<br>Besides <code>cloudinary</code> URLs, this field <b>also allows Loom's own CDN</b> (<code>cdn.loom.com</code>), so a Loom thumbnail URL works directly. Other domains are blocked.",
      side: "top",
      align: "start",
    },
    {
      group: "lessonForm",
      el: '[data-tour="lesson-form-meta"]',
      title: "分類、標籤與排序",
      desc: "<b>分類</b>會變成前台的分組標題，同一系列請填一模一樣的字。<b>標籤</b>用半形逗號分隔就好，不用自己打 #。<br><b>排序</b>數字小的排前面，想置頂就填 0。",
      titleEn: "Category, tags, and order",
      descEn: "<b>Category</b> becomes the group heading on your public site, so type it identically across a series. <b>Tags</b> are comma-separated — no need to type the # yourself.<br>Lower <b>order</b> numbers come first; use 0 to pin something to the top.",
      side: "top",
      align: "start",
    },
    {
      group: "lessonForm",
      el: '[data-tour="lesson-form-transcript"]',
      title: "逐字稿",
      desc: "把 Loom 匯出的 <code>VTT</code> / <code>SRT</code> 全文整段貼進來，後端會自動切成<b>可跟著影片捲動</b>的字幕，順便被搜尋引擎讀到。<br>懶得匯出的話，勾下面那個選項讓後端試著自己抓——<em>不保證成功</em>。",
      titleEn: "The transcript",
      descEn: "Paste Loom's whole <code>VTT</code> or <code>SRT</code> export in. The backend splits it into captions that <b>scroll along with the video</b>, and search engines read them too.<br>Too much trouble? Tick the option below and let the backend try to fetch it — <em>no guarantees</em>.",
      side: "top",
      align: "start",
    },
    {
      group: "lessonForm",
      el: '[data-tour="lesson-form-submit"]',
      title: "存檔",
      desc: "按下去就建立。下方的「<b>立即發佈</b>」勾了會馬上出現在前台；還沒確認內容就<em>先取消勾選</em>存成草稿，之後再從列表發佈。",
      titleEn: "Save",
      descEn: "This creates the lesson. Tick <b>Publish now</b> below and it appears on your public site immediately; if the content isn't final, <em>leave it unticked</em> to keep a draft and publish from the list later.",
      side: "top",
      align: "end",
    },

    // ── 回到列表 ──
    {
      el: '[data-tour="lessons-row-actions"]',
      title: "日常維護",
      desc: "每一列都有三顆鈕：<b>編輯</b>回到剛才的表單、<b>發佈／下架</b>一鍵切換前台可見、<b>刪除</b>會再問一次而且是<em>軟刪除</em>，資料還留著。",
      titleEn: "Day-to-day upkeep",
      descEn: "Every row has three buttons: <b>Edit</b> reopens that form, <b>Publish / Unpublish</b> toggles public visibility in one click, and <b>Delete</b> asks first and is a <em>soft delete</em> — the data stays.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "左側可以切換到其他管理頁。<b>每一頁的右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "Tour complete",
      descEn: "The sidebar takes you to the other admin pages. <b>Every page carries that ? in the bottom-right corner</b> — press it again whenever you need it.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>左上角的選單鈕可以叫出各個管理頁。<b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "Tour complete",
      descEn: "To reach another admin page, tap <b>the menu button in the top-left</b> and the full list slides out.<br>That button is how you get to every admin page. <b>Every page carries that ? in the bottom-right corner</b> — press it again whenever you need it.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
