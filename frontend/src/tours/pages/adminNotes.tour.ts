/**
 * 客戶筆記本後台（/admin/notes）導覽 — 教練視角
 * @module tours/pages/adminNotes.tour
 *
 * 這一頁有兩種畫面：筆記本「列表」與打開後的「工作區」。
 * 兩邊的步驟寫在同一份定義裡 —— 找不到目標元素的步驟會被引擎安靜跳過，
 * 所以在列表按「?」會看到列表那幾步，在工作區按就會看到工作區那幾步。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-notes",
  title: "客戶筆記本導覽",
  titleEn: "Client notebooks tour",

  steps: [
    {
      title: "客戶筆記本",
      desc: "這是你和<b>買了課程的客戶</b>共用的筆記本 —— 像 Notion 一樣可以無限往下開子頁。<b>兩邊都能編輯</b>：你寫的課表客戶看得到，客戶回報的狀況你也馬上看得到。每位客戶<b>只看得到自己那一本</b>，你則看得到全部。",
      titleEn: "Client notebooks",
      descEn:
        "A shared notebook between you and a client who <b>bought a course</b> — Notion-style, with sub-pages nested as deep as you like. <b>Both sides can edit</b>: your programming is visible to them, their notes come straight back to you. Each client sees <b>only their own</b>; you see them all.",
    },
    {
      el: '[data-tour="notes-create-button"]',
      title: "建立一本筆記本",
      desc: "選<b>客戶</b>、選<b>課程</b>、取個名字就好。裡面有個「<b>順便開通這門課的授權</b>」勾選項 —— 金流還沒接上前，這就是手動「開課」的地方；<em>沒開通的話客戶在自己頁面看不到這本</em>。",
      titleEn: "Create a notebook",
      descEn:
        "Pick a <b>client</b>, pick a <b>course</b>, give it a name. The <b>\"Also grant access to this course\"</b> checkbox is how you unlock a course by hand while payments aren't wired up yet — <em>without it the client won't see the notebook at all</em>.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="notes-notebook-list"]',
      title: "筆記本清單",
      desc: "每張卡是一本筆記本，顯示<b>課程</b>、<b>客戶</b>與最後更新時間。點卡片進去編輯；右下角的「刪除」會讓客戶<em>立刻</em>看不到，請確認過再按。",
      titleEn: "The notebook list",
      descEn:
        "One card per notebook, showing the <b>course</b>, the <b>client</b>, and when it was last touched. Tap a card to open it; \"Delete\" at the bottom right cuts the client off <em>immediately</em>, so be sure before you use it.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="notes-page-tree"]',
      title: "頁面樹",
      desc: "左邊是這本筆記本的<b>目錄</b>，可以無限層。每一列滑過去會出現四顆鈕：<b>＋</b> 新增子頁、<b>鉛筆</b> 改名、<b>三橫線</b> 移動到別的上層頁、<b>垃圾桶</b> 刪除（連同子頁）。最上面那一頁是<em>封面頁</em>，不能移動也不能刪。",
      titleEn: "The page tree",
      descEn:
        "The <b>outline</b> of this notebook on the left, nested as deep as you need. Hover a row for four buttons: <b>＋</b> add a sub-page, <b>pencil</b> rename, <b>lines</b> move it under a different parent, <b>bin</b> delete it (sub-pages included). The very top page is the <em>cover</em> — it can't be moved or deleted.",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="notes-database-board"]',
      title: "封面頁＝分類看板",
      desc: "每本筆記本的第一頁是<b>看板</b>：一欄就是一個<b>分類</b>（第 1 期、飲食、體態紀錄…），一張卡就是<b>一頁筆記</b>，點卡片就開那一頁。<b>把卡片拖到別欄</b>即可換分類（手機請用卡片右上角的「⋯」→「移到分類…」）。每欄下面的「<b>＋ 新增</b>」會直接在那一欄開一頁新的。",
      titleEn: "The cover page is a board",
      descEn:
        "Every notebook opens on a <b>board</b>: each column is a <b>category</b> (Block 1, Nutrition, Check-ins…) and each card is <b>one page</b> — tap a card to open it. <b>Drag a card to another column</b> to recategorise it (on a phone use the card's <b>⋯</b> → \"Move to category…\"). <b>+ New</b> at the foot of a column creates a page right in that column.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="notes-board-categories"]',
      title: "管理分類",
      desc: "新增／改名／換顏色／用箭頭調整<b>欄位左右順序</b>，改完按「儲存」。刪除分類<em>不會刪掉卡片</em> —— 那一欄的卡片會全部歸到最後的「<b>未分類</b>」欄，你隨時能再拖回去。",
      titleEn: "Manage categories",
      descEn:
        "Add, rename, recolour, and use the arrows to <b>reorder the columns</b> — then hit Save. Deleting a category <em>never deletes cards</em>: they all fall into the trailing <b>No category</b> column, ready to be dragged back.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="notes-editor-canvas"]',
      elMobile: '[data-tour="notes-page-title"]',
      title: "編輯器",
      desc: "直接開始打字就好。按 <code>/</code> 叫出區塊選單（標題、清單、待辦、引言、程式碼…），最下面還有筆記本專屬的「<b>子頁面</b>」與「<b>資料庫</b>」—— 選了會馬上開一頁新的，並在游標處放一張<b>可點的頁面卡片</b>（資料庫就是再開一個看板）。<b>不用按儲存</b> —— 停下來約 1.5 秒就會自動存檔。",
      titleEn: "The editor",
      descEn:
        "Just start typing. Press <code>/</code> for the block menu (headings, lists, to-dos, quotes, code…). At the bottom sit two notebook-only items: <b>Sub-page</b> and <b>Database</b> — either creates a new page on the spot and drops a <b>clickable page card</b> at your cursor (a database is just another board). <b>There's no save button</b> — it saves itself about 1.5 seconds after you stop.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="notes-save-state"]',
      title: "儲存狀態與「撞車」",
      desc: "標題右邊會顯示<b>尚未儲存 → 儲存中 → 已儲存</b>。如果你和客戶<em>同時</em>改同一頁，後存的那邊會看到黃色的「<b>內容已被對方更新</b>」橫幅：這時你的最後幾筆修改<b>沒有存進去</b>，按「重新載入」拿回對方的版本再改一次即可。",
      titleEn: "Save state & collisions",
      descEn:
        "Next to the title you'll see <b>Unsaved → Saving… → Saved</b>. If you and the client edit the same page at the <em>same time</em>, whoever saves second gets an amber <b>\"the other side updated this page\"</b> banner — those last edits <b>did not save</b>. Hit Reload to pick up their version and redo them.",
      side: "left",
      align: "end",
    },
    {
      title: "就這樣！",
      desc: "看板管方案的<b>結構</b>，編輯器寫每一頁的<b>內容</b>，兩邊都跟客戶即時共用。<br>需要再看一次教學，按右下角的「<b>?</b>」。",
      titleEn: "That's it",
      descEn:
        "The board holds the <b>structure</b> of a programme, the editor holds the <b>content</b> of each page — and your client sees both live.<br>Need this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
