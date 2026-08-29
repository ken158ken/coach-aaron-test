/**
 * 影片管理（/admin/videos）導覽
 * @module tours/pages/adminVideos.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-videos",
  title: "影片管理導覽",
  titleEn: "Reels management tour",

  groups: {
    /** 「批量新增影片」彈窗——導覽會自動按下按鈕開啟，走完自動關閉 */
    addForm: {
      open: '[data-tour="videos-add"]',
      wait: '[data-tour-modal="video-add"]',
      close: '[data-tour-modal="video-add"] [data-tour-modal-close]',
    },
  },

  steps: [
    {
      title: "影片管理",
      desc: "這一頁管的是前台<b>短影音牆</b>：IG、YouTube、Facebook、TikTok 的連結都收在這裡，重點是<em>排出想讓訪客先看到的順序</em>。<br>接下來帶你走一遍，隨時可以按右上角 × 離開。",
      titleEn: "Reels management",
      descEn: "This page runs the <b>short-video wall</b> on your public site: IG, YouTube, Facebook, and TikTok links all collect here, and the real job is <em>ordering what visitors see first</em>.<br>Here's a walkthrough — leave any time with the × in the top-right corner.",
    },
    {
      el: '[data-tour="videos-add"]',
      title: "新增影片",
      desc: "這顆會打開<b>批量新增</b>彈窗，一次可以貼好幾支影片再一起送出，不用一支一支存。<br>下一步直接幫你打開它。",
      titleEn: "Add Reels",
      descEn: "This opens the <b>batch add</b> modal, so you can paste several videos and submit them together instead of saving one at a time.<br>The next step opens it for you.",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在「批量新增影片」彈窗內 ──
    {
      group: "addForm",
      el: '[data-tour="videos-row-url"]',
      title: "貼上影片連結",
      desc: "把該平台的分享網址整段貼進來就好。系統會<b>自動判斷平台</b>並標上 IG／YouTube／FB／TikTok，不用自己選分類。",
      titleEn: "Paste the video link",
      descEn: "Paste the platform's share URL whole. The system <b>detects the platform itself</b> and labels it IG / YouTube / FB / TikTok — there is no category to pick.",
      side: "bottom",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="image-input-dropzone"]',
      title: "截圖：直接上傳",
      desc: "右邊的截圖欄有<b>兩種來源</b>，先看第一種：把圖<em>拖進這個框</em>或點一下選檔。上傳後會自動壓成 WebP，單檔上限 <code>5MB</code>。<br>不填也可以，前台會沿用平台的預設縮圖。",
      titleEn: "Thumbnail: upload a file",
      descEn: "The thumbnail field has <b>two sources</b>; here is the first. <em>Drag an image into this box</em> or click to browse. Uploads are converted to WebP automatically, <code>5MB</code> per file.<br>Leave it empty and your public site falls back to the platform's own thumbnail.",
      side: "left",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="image-input-tab-url"]',
      title: "截圖：貼 Cloudinary 網址",
      desc: "第二種來源。圖片如果<b>已經在圖庫上</b>，切到這個頁籤直接貼網址就好，不用再上傳一次。<br>網址必須是 <code>cloudinary</code> 開頭，貼錯會當場提示。",
      titleEn: "Thumbnail: paste a URL",
      descEn: "The second source. If the image is <b>already in the media library</b>, switch to this tab and paste the URL instead of uploading it again.<br>The URL must start with <code>cloudinary</code>; anything else is flagged on the spot.",
      side: "left",
      align: "start",
    },
    {
      group: "addForm",
      el: '[data-tour="videos-batch-submit"]',
      title: "一次送出",
      desc: "下面的「<b>＋ 再加一部影片</b>」可以繼續加列，填完再按這顆一起建立。<br>只有<em>連結和標題都填了</em>的那幾列會被送出，空白列會自動忽略。",
      titleEn: "Submit them together",
      descEn: "<b>+ Add another video</b> below keeps adding rows; fill them in, then press this once.<br>Only rows with <em>both a link and a title</em> are submitted — blank rows are ignored.",
      side: "top",
      align: "end",
    },

    // ── 回到列表 ──
    {
      el: '[data-tour="videos-search"]',
      title: "找特定影片",
      desc: "打字即時過濾標題與平台，不用按 Enter。<br>注意：<b>搜尋中會停用拖曳</b>，要排序請先清空關鍵字。",
      titleEn: "Find one video",
      descEn: "Type to filter by title and platform, no Enter needed.<br>Careful: <b>dragging is disabled while searching</b>, so clear the keyword before reordering.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="videos-view-toggle"]',
      title: "切換檢視方式",
      desc: "清單適合<b>大量調順序、改可見性</b>；小圖／中圖／大圖適合<em>用眼睛檢查縮圖</em>好不好看。",
      titleEn: "Switch how the list looks",
      descEn: "List view is for <b>bulk reordering and visibility changes</b>; the small, medium, and large grids let you <em>eyeball how the thumbnails look</em>.",
      side: "bottom",
      align: "end",
      only: "desktop",
    },
    {
      el: '[data-tour="videos-list"]',
      title: "排順序與上下架",
      desc: "直接<b>拖曳整列</b>換位置，或用 ▲▼ 微調、也可以直接改左邊的順序編號。<br>點「顯示／隱藏」可以先把影片下架而不刪掉。改完排序<b>一定要按上方出現的「儲存排序」</b>才會生效。",
      titleEn: "Reorder and hide",
      descEn: "<b>Drag a whole row</b> to move it, nudge it with ▲▼, or just type the order number on the left.<br>Show / Hide takes a video off your public site without deleting it. After reordering you <b>must press Save order</b> at the top or nothing sticks.",
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
