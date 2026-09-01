/**
 * 客戶筆記本後台（/admin/notes）導覽 — 教練視角
 * @module tours/pages/adminNotes.tour
 *
 * 版面是「左三層樹 + 右工作區」：左邊是 會員 → 筆記本 → 頁面，右邊是選中那一頁
 * 的看板／編輯器。找不到目標元素的步驟會被引擎安靜跳過，所以還沒選任何筆記本時
 * 只會走到樹那幾步；`<lg` 的樹收在抽屜裡，那幾步改指「目錄」鈕（`elMobile`）。
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
      el: '[data-tour="admin-notes-tree"]',
      elMobile: '[data-tour="notes-tree-toggle"]',
      title: "左邊是三層目錄",
      desc: "由外而內是<b>會員 → 筆記本 → 頁面</b>：最上層一位客戶一列（右邊的數字是他有幾本），點開是他名下的筆記本，再點一本就會展開<b>那一本的頁面樹</b>並在右邊打開它。<br>手機請按標頭的「<b>目錄</b>」把這棵樹叫出來。",
      titleEn: "One tree, three levels",
      descEn:
        "From the outside in: <b>client → notebook → page</b>. Each client is one row (the number is how many notebooks they have); open it to see their notebooks, and tap a notebook to expand <b>its page tree</b> and open it on the right.<br>On a phone, tap <b>Pages</b> in the header to bring the tree up.",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="notes-create-button"]',
      title: "建立一本筆記本",
      desc: "選<b>客戶</b>、選<b>課程</b>、取個名字就好。裡面有個「<b>順便開通這門課的授權</b>」勾選項 —— 金流還沒接上前，這就是手動「開課」的地方；<em>沒開通的話客戶在自己頁面看不到這本</em>。建好之後那位客戶就會出現在樹的第一層。",
      titleEn: "Create a notebook",
      descEn:
        "Pick a <b>client</b>, pick a <b>course</b>, give it a name. The <b>“Also grant access to this course”</b> checkbox is how you unlock a course by hand while payments aren't wired up yet — <em>without it the client won't see the notebook at all</em>. Once created, that client appears at the top level of the tree.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="admin-notes-notebook"]',
      title: "拖曳筆記本",
      desc: "整本筆記本可以<b>直接拖</b>：<br>• 拖到<b>另一位會員</b>那一組（整組會亮起來）＝ <b>轉移歸屬</b>，放開後會先問你一次，可順便勾「開通該課程授權」。原會員<em>立刻</em>失去存取。<br>• 在<b>同一位會員</b>底下上下拖（會出現金色插入線）＝ <b>調整順序</b>。<br>若目標會員<em>已經有同一門課的筆記本</em>，系統會擋下來並告訴你。",
      titleEn: "Drag a notebook",
      descEn:
        "A whole notebook is <b>draggable</b>:<br>• Drop it on <b>another client's</b> group (the group lights up) to <b>hand it over</b> — you get a confirmation first, with an option to grant that course's access at the same time. The old client loses access <em>immediately</em>.<br>• Drag it up or down <b>within one client</b> (a gold insertion line appears) to <b>reorder</b>.<br>If the target client <em>already has a notebook for that course</em>, the move is refused and you're told why.",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="admin-notes-nb-menu"]',
      title: "手機上用「⋯」",
      desc: "觸控螢幕沒有拖曳事件，所以每本筆記本右邊都有「<b>⋯</b>」：<b>轉移給…</b>（選一位會員）、<b>上移／下移</b>、<b>重新命名</b>、<b>刪除</b>。桌機滑過該列也會浮出<b>鉛筆</b>（改名）與<b>垃圾桶</b>（刪除）。",
      titleEn: "The “⋯” menu",
      descEn:
        "Touch screens don't fire drag events, so every notebook has a <b>⋯</b> menu: <b>Hand over to…</b> (pick a client), <b>Move up / down</b>, <b>Rename</b>, <b>Delete</b>. On a desktop, hovering the row also reveals the <b>pencil</b> (rename) and <b>bin</b> (delete).",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="notes-page-tree"]',
      title: "第三層：頁面樹",
      desc: "展開的筆記本底下就是它的<b>目錄</b>，可以無限層。每一列滑過去會出現四顆鈕：<b>＋</b> 新增子頁、<b>鉛筆</b> 改名、<b>三橫線</b> 移到別的上層頁、<b>垃圾桶</b> 刪除（連同子頁）。最上面那一頁是<em>封面頁</em>，不能移動也不能刪。",
      titleEn: "Level three: the page tree",
      descEn:
        "Under the open notebook sits its <b>outline</b>, nested as deep as you need. Hover a row for four buttons: <b>＋</b> add a sub-page, <b>pencil</b> rename, <b>lines</b> move it under a different parent, <b>bin</b> delete it (sub-pages included). The very top page is the <em>cover</em> — it can't be moved or deleted.",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="notes-database-board"]',
      title: "封面頁＝分類看板",
      desc: "每本筆記本的第一頁是<b>看板</b>：一欄就是一個<b>分類</b>（第 1 期、飲食、體態紀錄…），一張卡就是<b>一頁筆記</b>，點卡片就開那一頁。<b>把卡片拖到別欄</b>即可換分類（手機請用卡片右上角的「⋯」→「移到分類…」）。每欄下面的「<b>＋ 新增</b>」會直接在那一欄開一頁新的。",
      titleEn: "The cover page is a board",
      descEn:
        "Every notebook opens on a <b>board</b>: each column is a <b>category</b> (Block 1, Nutrition, Check-ins…) and each card is <b>one page</b> — tap a card to open it. <b>Drag a card to another column</b> to recategorise it (on a phone use the card's <b>⋯</b> → “Move to category…”). <b>+ New</b> at the foot of a column creates a page right in that column.",
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
        "Next to the title you'll see <b>Unsaved → Saving… → Saved</b>. If you and the client edit the same page at the <em>same time</em>, whoever saves second gets an amber <b>“the other side updated this page”</b> banner — those last edits <b>did not save</b>. Hit Reload to pick up their version and redo them.",
      side: "left",
      align: "end",
    },
    {
      title: "就這樣！",
      desc: "左邊那棵樹管<b>誰有哪幾本</b>（拖一下就能換人或換順序），看板管方案的<b>結構</b>，編輯器寫每一頁的<b>內容</b> —— 三邊都跟客戶即時共用。<br>需要再看一次教學，按右下角的「<b>?</b>」。",
      titleEn: "That's it",
      descEn:
        "The tree on the left tracks <b>who has which notebooks</b> (one drag hands one over or reorders it), the board holds the <b>structure</b> of a programme, and the editor holds the <b>content</b> of each page — all of it live for your client.<br>Need this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
