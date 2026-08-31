/**
 * 課程筆記本（/notes）導覽 — 學員視角
 * @module tours/pages/memberNotes.tour
 *
 * 與 `adminNotes.tour` 同一個畫面、不同語氣：學員不需要知道「開通授權」
 * 這類後台概念，只要知道「這是跟教練共用的、會自動存」。
 * 步驟找不到目標元素會被安靜跳過，所以列表與工作區共用同一份定義。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-notes",
  title: "課程筆記本導覽",
  titleEn: "Course notebook tour",

  steps: [
    {
      title: "你的課程筆記本",
      desc: "這是<b>你和教練共用</b>的筆記本。教練寫的課表、注意事項都在這裡，<b>你也可以直接編輯</b> —— 記錄當天的訓練感受、想問的問題，教練那邊都看得到。",
      titleEn: "Your course notebook",
      descEn:
        "A notebook <b>you share with your coach</b>. Their programming and reminders live here, and <b>you can edit it too</b> — jot down how a session felt or questions you want to ask, and your coach sees it right away.",
    },
    {
      el: '[data-tour="notes-notebook-list"]',
      title: "你的筆記本",
      desc: "一門課程一本筆記本。點卡片打開；看不到任何筆記本的話，代表教練還沒幫你建立。",
      titleEn: "Your notebooks",
      descEn:
        "One notebook per course. Tap a card to open it — if there's nothing here, your coach hasn't set one up for you yet.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="notes-page-tree"]',
      elMobile: '[data-tour="notes-tree-toggle"]',
      title: "目錄",
      desc: "左邊是這本筆記本的<b>目錄</b>，點任何一頁就會開在右邊。你也可以自己<b>新增子頁</b>（滑到該列按 ＋）來記自己的東西。<em>手機上按右上角的「目錄」叫出來。</em>",
      titleEn: "The outline",
      descEn:
        "The notebook's <b>outline</b> on the left — tap any page to open it on the right. You can <b>add your own sub-pages</b> too (hover a row and hit ＋). <em>On a phone, tap \"Pages\" at the top right to bring it up.</em>",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="notes-editor-canvas"]',
      elMobile: '[data-tour="notes-page-title"]',
      title: "直接開始寫",
      desc: "點一下就能打字。按 <code>/</code> 會跳出區塊選單（標題、清單、<b>待辦事項</b>、引言…），選取文字則會出現粗體／底線等格式工具列。",
      titleEn: "Just start writing",
      descEn:
        "Click anywhere and type. Press <code>/</code> for the block menu (headings, lists, <b>to-dos</b>, quotes…), or select text for bold / underline and the rest of the toolbar.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="notes-save-state"]',
      title: "會自動儲存",
      desc: "<b>沒有儲存按鈕</b>，停筆約 1.5 秒就會自己存好，右上角會顯示「已儲存」。萬一你和教練<em>剛好同時</em>改同一頁，會跳出「<b>內容已被對方更新</b>」的提醒 —— 按「重新載入」看教練最新的版本再繼續就好。",
      titleEn: "It saves itself",
      descEn:
        "There's <b>no save button</b> — about 1.5 seconds after you stop typing it saves, and you'll see \"Saved\" at the top right. If you and your coach happen to edit the same page at <em>the same moment</em>, you'll get a \"<b>the other side updated this page</b>\" notice — hit Reload to pick up their latest version and carry on.",
      side: "left",
      align: "end",
    },
    {
      title: "就這樣！",
      desc: "有問題直接寫在筆記本裡，教練看得到 💪<br>需要再看一次教學，按右下角的「<b>?</b>」。",
      titleEn: "That's it",
      descEn:
        "Got a question? Write it straight into the notebook — your coach will see it 💪<br>Need this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
