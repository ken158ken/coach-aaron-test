/**
 * Landing Page 編輯器（/admin/landing-pages/:id/edit）導覽
 *
 * 獨立全頁路由，不在 AdminLayout 之下，所以結語不引用側邊欄錨點。
 * 圖片欄位用共用元件 ImageInput，錨點 `image-input-*` 由該元件自帶。
 * @module tours/pages/adminLandingPageEditor.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-landing-page-editor",
  title: "Landing Page 編輯器導覽",

  steps: [
    {
      title: "Landing Page 編輯器",
      desc: "版型已經由模板決定好了，你在這裡做的是<b>把內容填進去</b>：換標題、換文案、換圖片。<br>左邊挑區塊、中間改內容、右上角存檔與發布。",
    },
    {
      el: '[data-tour="lped-info-nav"]',
      title: "基本設定",
      desc: "改後台專案名稱，以及最重要的<b>自訂網址</b>——公開頁的位置就是 <code>/page/你填的字</code>。<br>只吃英文、數字與連字號，設定好再拿去投廣告或放連結。",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="lped-groups"]',
      title: "頁面區塊清單",
      desc: "模板的每個段落（主視覺、方案、見證、常見問題…）在這裡各是一項，點一下就切到那段的欄位。<br>名稱旁邊出現<em>金色小圓點</em>，代表那一區有還沒存檔的修改。",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="lped-section-toggle"]',
      title: "隱藏用不到的區塊",
      desc: "模板附的段落不一定每個都要。點眼睛圖示就能<b>讓整區不出現在公開頁</b>，內容仍然保留，之後想用再點回來——比刪掉安全得多。",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="lped-variants"]',
      title: "配色方案",
      desc: "同一份模板通常附幾組色系。點色點就<b>立刻套用並自動存檔</b>，不用按儲存，換錯了再點回來即可。",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="lped-fields"]',
      title: "編輯欄位",
      desc: "左側選到的那一區，欄位會全部列在這裡。<b>標紅星的是必填</b>，留空公開頁會開天窗。<br>改過的欄位邊框會轉成金色，方便你回頭檢查動過哪些。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="image-input-tab-upload"]',
      title: "圖片方式一：上傳",
      desc: "圖片欄位有兩種來源，這是第一種。把檔案<b>拖進虛線框</b>或點一下選檔即可，系統會自動壓成 WebP。<br>支援 JPG / PNG / WebP / GIF / AVIF，<em>單檔上限 5MB</em>。",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="image-input-tab-url"]',
      title: "圖片方式二：貼 Cloudinary 網址",
      desc: "圖片已經在 Cloudinary 上（或設計師直接給你網址）就切到這個頁籤貼上，不用再上傳一次。<br>網址<b>必須是 Cloudinary 開頭</b>，其他來源會被擋下來。已有圖片時先按「更換」才會出現輸入區。",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="lped-save"]',
      title: "儲存變更",
      desc: "這顆會顯示<b>目前有幾個欄位待存</b>，一次批次送出，所以改完整頁再按一次就好。<br>沒有變更時它是灰的——看到灰色就代表都存過了。",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="lped-publish"]',
      title: "發布與收尾",
      desc: "內容確認好就按<b>發布</b>，公開網址立刻生效，旁邊也會多出<b>預覽</b>鈕讓你另開分頁檢查；活動結束按<b>下架</b>即可，資料都留著。<br><b>右下角的「?」隨時可以再看一次</b>這份導覽。",
      side: "bottom",
      align: "end",
    },
  ],
};

export default tour;
