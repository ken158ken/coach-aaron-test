/**
 * 內容管理（/admin/content）導覽
 * @module tours/pages/adminContent.tour
 *
 * 這一頁很大（六個分頁、四個圖片欄位），導覽刻意只走主線：
 * 大結構 → 怎麼編輯一則文案 → 圖片欄位的雙模式 → 怎麼存。
 * 圖片欄位（ImageInput）都藏在彈窗裡，所以用兩段 group 串起來：
 * 先切到「學員見證」分頁（tabTestimonial），再打開幻燈片表單（slideForm）。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-content",
  title: "內容管理導覽",

  groups: {
    /**
     * 第一段：切到「學員見證幻燈片」分頁。
     * 這裡的 `wait` 不是彈窗，而是切分頁後才會出現的「新增幻燈片」按鈕，
     * 用來確認分頁真的切過去了。
     */
    tabTestimonial: {
      open: '[data-tour="content-tab-testimonial"]',
      wait: '[data-tour="testimonial-add"]',
    },
    /** 第二段：從見證分頁打開幻燈片表單彈窗——裡面就是圖片欄位 */
    slideForm: {
      open: '[data-tour="testimonial-add"]',
      wait: '[data-tour-modal="testimonial-form"]',
      // `@/components/ui` 的 Modal 沒有 × 鈕 → 省略 close，引擎會送 Escape
    },
  },

  steps: [
    {
      title: "內容管理",
      desc: "前台首頁看得到的<b>文字、彈窗、幻燈片、跑馬燈</b>都在這一頁改，改完立刻生效、不用重新部署。<br>接下來帶你走一遍主線，隨時可以按右上角 × 離開。",
    },
    {
      el: '[data-tour="content-tabs"]',
      title: "先認得這六個分頁",
      desc: "整頁的骨架就是這排分頁：<b>網站文案</b>改字、<b>首頁彈窗</b>做公告、<b>學員見證</b>與<b>相片輪播</b>管幻燈片、<b>Marquee</b>放認證與成果數字、<b>Podcast</b>管單集。<br>先想「要改的東西長在首頁哪一塊」，再挑分頁就不會迷路。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="content-item-row"]',
      title: "改一句文案就這樣做",
      desc: "文案分頁會<b>照首頁區塊分組</b>，往下捲就跟首頁由上到下的順序一樣。<br>找到那一列後按<b>編輯</b>改內容、按<b>儲存</b>送出；左邊的開關是<em>暫時隱藏</em>（前台改用預設值），右邊的刪除才是真的移除。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="content-add-field"]',
      title: "什麼時候才需要新增欄位",
      desc: "既有文案改字<b>不用</b>新增欄位。只有前端工程師新拉了一個位置、清單裡卻找不到對應項目時才用它。<br>類型選<em>圖片</em>的話，下面就會變成圖片欄位——也就是接下來要介紹的那個。",
      side: "bottom",
      align: "end",
    },

    // ── 切到見證分頁 ──
    {
      group: "tabTestimonial",
      el: '[data-tour="testimonial-config"]',
      title: "幻燈片的整體設定",
      desc: "以「學員見證」為例：這排是<b>整組</b>的設定——發布開關決定首頁要不要顯示、版型切直立／橫式／引言牆、輪播間隔改完要按<b>套用</b>才存。<br>拿不定主意就先按<em>預覽效果</em>看實際樣子。",
      side: "bottom",
      align: "start",
    },

    // ── 進表單彈窗：圖片欄位雙模式（本次重點）──
    {
      group: "slideForm",
      el: '[data-tour="image-input-tabs"]',
      title: "圖片欄位有兩種來源",
      desc: "全站的圖片欄位都長這樣，右上角兩個頁籤就是兩種放圖方式：<b>上傳圖片</b>（電腦裡的檔案）或 <b>Cloudinary 網址</b>（已經在圖庫裡的圖）。<br>兩種擇一即可，隨時可以切換重來。",
      side: "bottom",
      align: "end",
    },
    {
      group: "slideForm",
      el: '[data-tour="image-input-dropzone"]',
      title: "方式一：直接上傳",
      desc: "把檔案<b>拖進來</b>或點一下選檔就好。系統會自動壓成 <code>WebP</code> 並上傳到圖庫，所以手機拍的原圖也不必先修圖。<br>單檔上限 <b>5MB</b>，太大請先裁切再上傳。",
      side: "top",
      align: "start",
    },
    {
      group: "slideForm",
      el: '[data-tour="image-input-tab-url"]',
      title: "方式二：貼 Cloudinary 網址",
      desc: "同一張圖要重複用、或別人已經幫你上傳好了，就切到這個頁籤把網址貼上。<br>只接受 <em>Cloudinary</em> 開頭的網址；貼錯來源會當場跳紅字提醒，不會等到儲存才失敗。",
      side: "bottom",
      align: "end",
    },
    {
      group: "slideForm",
      el: '[data-tour="testimonial-form-submit"]',
      title: "存檔才會生效",
      desc: "圖片<b>上傳完不等於存好</b>，一定要按這顆儲存，這筆幻燈片才會寫進資料庫。<br>存完回列表把開關打開，前台首頁就看得到了。",
      side: "top",
      align: "end",
    },

    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "其他分頁（彈窗、相片輪播、Marquee、Podcast）的操作邏輯都一樣：<b>設定列管整組、列表管單筆、彈窗裡編輯</b>。<br><b>每一頁右下角都有這顆「?」</b>，忘了就再按一次。",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "其他分頁（彈窗、相片輪播、Marquee、Podcast）的操作邏輯都一樣：<b>設定列管整組、列表管單筆、彈窗裡編輯</b>。<br><b>每一頁右下角都有這顆「?」</b>，忘了就再按一次。",
      only: "mobile",
    },
  ],
};

export default tour;
