/**
 * 訊息（/chat、/chat/:conversationId）導覽 — 學員視角
 * @module tours/pages/memberChat.tour
 *
 * RWD 說明：
 *   桌機（≥1024px）左右兩欄同時在；手機是<b>單欄切換</b>——
 *   在 /chat 只看得到對話清單，進到 /chat/:id 只看得到訊息區。
 *   因此清單與訊息兩邊的步驟都不標 `only`，讓引擎依當下畫面自動略過看不見的那半；
 *   只有「返回清單」是手機專屬（`only: "mobile"`），
 *   「關閉對話」則是桌機專屬的說法，寫在標題列那一步裡。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-chat",
  title: "訊息導覽",
  titleEn: "Messages tour",

  groups: {
    /** 「開啟新對話」彈窗；手機在訊息畫面裡看不到 + 鈕時，這組會自動跳過 */
    newChat: {
      open: '[data-tour="chat-new"]',
      wait: '[data-tour-modal="chat-new"]',
      // `@/components/ui` 的 Modal 沒有 × 鈕 → 引擎改送 Escape 關閉
    },
  },

  steps: [
    {
      title: "跟教練直接聊",
      desc: "有問題不想等 email？在這裡<b>即時傳訊息給教練</b>，也可以傳訓練照片或動作影片截圖讓教練看。",
      titleEn: "Talk to your coach directly",
      descEn: "Got a question and don't want to wait on email? <b>Message the coach in real time</b> right here — training photos and screenshots of your form included.",
    },
    {
      el: '[data-tour="chat-list"]',
      title: "你的對話清單",
      desc: "每一列是一個對話。頭像右下角的小圓點是對方<b>目前在不在線上</b>，右側數字則是<em>你還沒讀的訊息數</em>。點一下就能打開。",
      titleEn: "Your conversations",
      descEn: "Each row is one conversation. The dot on the corner of the avatar says <b>whether that person is online right now</b>, and the number on the right is <em>how many messages you haven't read</em>. Tap to open.",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="chat-new"]',
      title: "開一個新對話",
      desc: "第一次找教練聊，或想找別的學員，都從這顆<b>＋</b>開始。<br>下一步會直接幫你打開它看看。",
      titleEn: "Start a new conversation",
      descEn: "First time messaging the coach, or looking for another user? It all starts with this <b>＋</b>.<br>The next step opens it for you.",
      side: "bottom",
      align: "end",
    },

    // ── 以下步驟在「開啟新對話」彈窗內 ──
    {
      group: "newChat",
      el: '[data-tour="chat-new-admins"]',
      title: "教練與管理員",
      desc: "教練群固定釘在最上面，<b>點頭像就直接開始一對一私訊</b>，不用先加好友。<br>這是最快找到教練的方式。",
      titleEn: "Coaches and admins",
      descEn: "The coaching team stays pinned to the top. <b>Tap an avatar and a one-to-one chat opens</b> — no friend request needed.<br>This is the fastest way to reach your coach.",
      side: "bottom",
      align: "start",
    },
    {
      group: "newChat",
      el: '[data-tour="chat-new-search"]',
      title: "找其他會員",
      desc: "想跟一起上課的同學聊？點一下就會展開名單，或<b>輸入名字直接搜尋</b>，選到人就會開好對話。",
      titleEn: "Find other users",
      descEn: "Want to talk to someone training alongside you? Tap to expand the list, or <b>type a name to search</b>. Pick a person and the conversation opens.",
      side: "top",
      align: "start",
    },

    // ── 對話內容 ──
    {
      el: '[data-tour="chat-thread-header"]',
      title: "對話上方的工具",
      desc: "這裡顯示對方的名字與<b>上次上線時間</b>。右邊的下載圖示可以把整段對話存成 <code>txt</code>／<code>Word</code>／<code>Excel</code> 備份；桌機最右邊的 <code>×</code> 是關閉這個對話，不會刪掉紀錄。",
      titleEn: "Tools above the thread",
      descEn: "You get the other person's name and <b>when they were last online</b>. The download icon saves the whole thread as <code>txt</code>, <code>Word</code>, or <code>Excel</code>. On desktop, the <code>×</code> at the far right just closes the thread — it does not delete anything.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="chat-messages"]',
      title: "訊息只留 7 天",
      desc: "為了保護隱私，訊息<b>七天後會自動消失</b>。<em>重要的內容（課表、地點、金額）建議自己另外記下來</em>，或用上面的匯出功能存檔。",
      titleEn: "Messages last 7 days",
      descEn: "For privacy, messages <b>disappear automatically after seven days</b>. <em>Write down anything that matters — schedules, addresses, amounts</em> — or export the thread with the icon above.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="chat-input"]',
      title: "傳訊息",
      desc: "打字後按 <code>Enter</code> 送出，要換行請用 <code>Shift + Enter</code>。<br>左邊的圖片鈕可以附一張照片（jpg／png／webp／gif，5MB 以內），送出前還能先預覽。",
      titleEn: "Send a message",
      descEn: "<code>Enter</code> sends; <code>Shift + Enter</code> starts a new line.<br>The image button on the left attaches one photo (jpg, png, webp, or gif, under 5MB), and you see a preview before it goes.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="chat-back"]',
      title: "回到對話清單",
      desc: "手機一次只顯示一邊。看完訊息想換人聊，按這顆<b>返回</b>就回到清單。",
      titleEn: "Back to the list",
      descEn: "A phone shows one side at a time. Done reading and want to talk to someone else? <b>Back</b> returns you to the conversation list.",
      side: "bottom",
      align: "start",
      only: "mobile",
    },
    {
      title: "導覽完成",
      desc: "新訊息會在網站右上角的鈴鐺跳提醒；想在關掉網頁時也收得到，去<b>通知中心</b>把瀏覽器推播打開。<br>需要再看一次教學，按右下角的「<b>?</b>」就好。",
      titleEn: "Tour complete",
      descEn: "New messages ping the bell in the top right. To get them even with the site closed, turn on browser push in the <b>Notifications</b> page.<br>Want this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
