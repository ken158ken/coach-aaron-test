/**
 * 通知中心（/notifications）導覽 — 學員視角
 * @module tours/pages/memberNotifications.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-notifications",
  title: "通知中心導覽",
  titleEn: "Notifications tour",

  steps: [
    {
      title: "通知中心",
      desc: "教練回覆你的預約、有人傳新訊息、被加進群組——這些提醒都會集中在這一頁，<b>保留 7 天後自動清掉</b>。",
      titleEn: "Notifications",
      descEn: "A coach answering your booking, a new message, being added to a group — every alert collects on this page and <b>clears itself after 7 days</b>.",
    },
    {
      el: '[data-tour="notif-push"]',
      title: "建議打開推播",
      desc: "沒開的話，只有<em>停留在網站上</em>才看得到提醒。<b>啟用推播</b>之後，就算關掉瀏覽器，教練確認你的預約時手機或電腦也會跳通知。<br>按下去瀏覽器會先問你要不要允許，選「允許」即可。",
      titleEn: "Turn on push",
      descEn: "Without it, alerts only reach you <em>while you're on the site</em>. <b>Enable push</b> and your phone or computer buzzes when the coach confirms a booking, even with the browser closed.<br>Press it and your browser asks first — choose Allow.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="notif-filter"]',
      title: "只看還沒讀的",
      desc: "通知一多就容易漏。切到<b>未讀</b>只留下你還沒點開的，處理完清空就安心了；旁邊的數字就是目前未讀幾則。",
      titleEn: "Show unread only",
      descEn: "Things slip through once alerts pile up. Switch to <b>Unread</b> and only what you haven't opened remains — work the list down to empty. The number beside it is your current unread count.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="notif-item"]',
      title: "點一下就跳過去",
      desc: "左邊的圖示代表類型（💬 訊息、✅ 預約通過、❌ 被拒絕…）。<b>有金色外框的是未讀</b>。<br>點整列會<em>自動標成已讀</em>並帶你到對應的對話或預約頁，不用自己找。",
      titleEn: "Tap to jump straight there",
      descEn: "The icon on the left is the type (💬 message, ✅ booking approved, ❌ declined, and so on). <b>A gold border means unread.</b><br>Tapping the row <em>marks it read</em> and takes you to that conversation or booking — no hunting for it.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="notif-delete"]',
      title: "刪掉單一則",
      desc: "看過不想再留著，按 <code>✕</code> 直接移除這一則。<b>只是清掉這則提醒</b>，原本的訊息或預約紀錄都還在。",
      titleEn: "Delete one alert",
      descEn: "Read it and don't want it around? <code>✕</code> removes that row. <b>It only clears the alert</b> — the message or booking behind it stays put.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="notif-mark-all"]',
      title: "一次全部已讀",
      desc: "累積太多懶得一則則點？按這裡把<b>全部標成已讀</b>，右上角鈴鐺的紅點就會歸零。<br>（沒有未讀時這顆鈕不會出現。）",
      titleEn: "Clear them all at once",
      descEn: "Too many to tap one by one? This <b>marks everything read</b> and resets the red dot on the bell.<br>(The button hides itself when there is nothing unread.)",
      side: "bottom",
      align: "end",
    },
    {
      title: "導覽完成",
      desc: "通知只是提醒，實際內容還是在<b>訊息</b>與<b>我的預約</b>兩頁。<br>需要再看一次教學，按右下角的「<b>?</b>」就好。",
      titleEn: "Tour complete",
      descEn: "Notifications are only pointers — the real content lives on the <b>Messages</b> and <b>My Bookings</b> pages.<br>Want this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
