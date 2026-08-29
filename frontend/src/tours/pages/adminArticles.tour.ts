/**
 * 文章管理（/admin/articles）導覽
 * @module tours/pages/adminArticles.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-articles",
  title: "文章管理導覽",
  titleEn: "Article management tour",

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
      titleEn: "Article management",
      descEn: "Every <b>blog article</b> on the site is on this page: create, search, feature, change status.<br>Here's a walkthrough — leave any time with the × in the top-right corner.",
    },
    {
      el: '[data-tour="articles-full-editor"]',
      title: "新增文章（完整版）",
      desc: "要正式寫一篇文章，從這裡進<b>全螢幕編輯器</b>——有封面圖、Banner、標籤與圖文排版，草稿還會自動暫存。",
      titleEn: "New article, full editor",
      descEn: "Writing a real article? Start here for the <b>full-screen editor</b> — cover image, banner, tags, rich layout, and drafts that autosave.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="articles-quick-add"]',
      title: "快速新增",
      desc: "只是想先<em>把題目記下來</em>、之後再寫？用快速新增填個標題就能先存成草稿。<br>下一步會直接幫你打開它。",
      titleEn: "Quick add",
      descEn: "Just want to <em>park the idea</em> and write it later? Quick add saves a draft from a title alone.<br>The next step opens it for you.",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在「快速新增」彈窗內 ──
    {
      group: "quickForm",
      el: '[data-tour="article-form-title"]',
      title: "文章標題",
      desc: "唯一的必填欄位。下面的<b>網址識別碼留空會自動產生</b>，沒有 SEO 上的特別考量就別動它。",
      titleEn: "Article title",
      descEn: "The only required field. The <b>URL slug below is generated for you if you leave it blank</b>, so don't touch it without an SEO reason.",
      side: "bottom",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="article-form-content"]',
      title: "文章內容",
      desc: "圖文編輯器，可以排版、插圖、加影片。<br>工具列的<b>插圖</b>按鈕支援兩種來源：直接<em>上傳圖片</em>，或貼上 <em>Cloudinary 網址</em>。",
      titleEn: "Article body",
      descEn: "A rich editor for layout, images, and video.<br>The <b>image</b> button on the toolbar takes two sources: <em>upload a file</em>, or paste a <em>Cloudinary URL</em>.",
      side: "top",
      align: "start",
    },
    {
      group: "quickForm",
      el: '[data-tour="article-form-status"]',
      title: "狀態與精選",
      desc: "<b>草稿</b>只有你看得到、<b>發布</b>會出現在前台文章列表。勾<b>設為精選</b>會被推到首頁與列表最前面，建議只留 2～3 篇。<br>填完按右下角<b>建立</b>存檔。",
      titleEn: "Status and featuring",
      descEn: "<b>Draft</b> is yours alone; <b>published</b> appears in the article list on your public site. Ticking <b>Feature this</b> pushes it to the front of the home page and the list — keep it to two or three.<br>Press <b>Create</b> at the bottom right to save.",
      side: "top",
      align: "start",
    },

    // ── 回到列表 ──
    {
      el: '[data-tour="articles-search"]',
      title: "搜尋文章",
      desc: "輸入關鍵字後按 <code>Enter</code>（或右邊的搜尋鈕）向後端查詢；清空欄位會自動回到完整列表。",
      titleEn: "Search articles",
      descEn: "Type a keyword and press <code>Enter</code> (or the search button) to query the backend; clearing the field brings the full list back.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="articles-status-filter"]',
      title: "三組篩選器",
      desc: "由左到右是<b>狀態</b>、<b>分類</b>、<b>精選</b>。想把沒寫完的補完就選「草稿」；想檢查首頁推薦是否過多就選「僅精選」。",
      titleEn: "Three filters",
      descEn: "Left to right: <b>status</b>, <b>category</b>, <b>featured</b>. Choose Draft to finish what you started; choose Featured only to check you haven't over-promoted the home page.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="articles-table"]',
      title: "文章列表",
      desc: "點<b>★／☆</b>就能直接切換精選，不用進編輯器。右邊三個動作：<b>編輯</b>進完整編輯器、<b>快速編輯</b>開剛才那個彈窗、<b>刪除</b>會再問一次。<br>點欄位標題可排序；右上角可切成圖卡檢視檢查封面圖。",
      titleEn: "The article list",
      descEn: "Click the <b>★ / ☆</b> to toggle featuring without opening the editor. Three actions on the right: <b>Edit</b> for the full editor, <b>Quick edit</b> for that modal, and <b>Delete</b>, which asks first.<br>Column headers sort, and the top-right switch turns the list into cards for checking cover images.",
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
