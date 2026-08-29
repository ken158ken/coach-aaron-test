/**
 * 文章編輯器（/admin/articles/new、/admin/articles/:id/edit）導覽
 * @module tours/pages/adminArticleEditor.tour
 *
 * @description
 * 同一份步驟同時服務「新增文章」與「編輯文章」，所以文案不假設有沒有既有內容。
 * 這頁是獨立全頁編輯器（不在 AdminLayout 之下），因此不引用側邊欄錨點，
 * 「?」鈕由頁面自己掛的 `<HelpTourButton />` 提供。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-article-editor",
  title: "文章編輯器導覽",

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
      title: "文章編輯器",
      desc: "這裡是寫文章的地方：<b>左邊寫內容、右邊設定發布資訊</b>。<br>不管是新開一篇還是回來修舊的，操作都一樣。內容每 30 秒會自動暫存在瀏覽器，不怕誤關視窗。",
    },
    {
      el: '[data-tour="article-editor-title"]',
      title: "先給它一個標題",
      desc: "標題是<b>唯一必填</b>的欄位，沒填不能發布。前台的列表卡片、搜尋結果都吃這一行，寫得具體一點會比較好點。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="editor-toolbar"]',
      title: "內容工具列",
      desc: "像 Word 一樣：選取文字再按 <b>B / I / U</b> 或標題大小。右段是媒體——<em>🖼️ 插圖</em>、<em>🏞️ 圖片庫</em>、<em>🎬 YouTube</em>、<em>🎙️ Loom</em>、<em>🔗 連結</em>。<br>下一步直接示範插圖。",
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
      el: '[data-tour="article-editor-slug"]',
      title: "網址代稱",
      desc: "文章網址的尾巴，例如 <code>/articles/my-first-post</code>。只收小寫英數與 <code>-</code>，<b>留空會自動產生</b>；重複的話下方會馬上跳紅字提醒。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="article-editor-category"]',
      title: "分類與標籤",
      desc: "分類決定文章歸在哪一區，不夠用就按<b>管理分類</b>自己加。下面的標籤打完按 <code>Enter</code> 新增，主要餵給搜尋引擎與相關文章推薦。",
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
      desc: "已經把圖放在 Cloudinary？切到這個頁籤把網址貼上再按「套用」即可。<b>網址必須是 <code>res.cloudinary.com</code> 開頭</b>，貼錯會當場擋下來。<br>換圖就按預覽下方的<b>更換</b>。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="article-editor-status"]',
      title: "草稿還是發布",
      desc: "拿不定主意就留<b>草稿</b>——存起來只有後台看得到，讀者不會看到半成品。改成<b>已發布</b>才會出現在前台文章列表。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="article-editor-actions"]',
      title: "存檔與發布",
      desc: "<b>儲存草稿</b>只存進你這台瀏覽器（換電腦看不到）；<b>預覽並發布</b>會先跳出預覽讓你確認版面，按下確認才真的寫進資料庫。<br>導覽結束——右下角的<b>「?」</b>隨時可以再看一次。",
      side: "bottom",
      align: "end",
    },
  ],
};

export default tour;
