/**
 * Google 日曆管理（/admin/google-calendar）導覽
 * @module tours/pages/adminGoogleCalendar.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-google-calendar",
  title: "Google 日曆管理導覽",
  titleEn: "Google Calendar tour",

  steps: [
    {
      title: "Google 日曆管理",
      desc: "這一頁只做一件事：決定<b>預約系統要同步到哪一個 Google 帳號</b>。<br>連好之後日曆事件、會員邀請、提醒與 Meet 連結全都自動處理，平常不用再進來。",
      titleEn: "Google Calendar",
      descEn: "This page does one thing: it decides <b>which Google account your bookings sync to</b>.<br>Once connected, calendar events, member invites, reminders and Meet links are all handled for you — you rarely need to come back.",
    },
    {
      el: '[data-tour="gcal-status"]',
      title: "先看現在連到誰",
      desc: "四種狀態：<b>已連結</b>會一併顯示日曆 ID；<b>尚未連結</b>代表預約核准後不會產生日曆事件；<b>連結已失效</b>通常是授權過期或被撤銷，重新連一次就好。<br>發現預約沒進日曆時，第一件事就是回來看這裡。",
      titleEn: "Check who is connected",
      descEn: "Read the status carefully: <b>Connected</b> also shows the calendar ID; <b>Not connected</b> means approved bookings create no calendar event at all; <b>Connection expired</b> usually means the authorization lapsed or was revoked — just connect again.<br>If a booking never reached the calendar, look here first.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="gcal-connect"]',
      title: "連結 / 切換帳號",
      desc: "按下去會開一個小視窗跑 Google 授權，<b>本頁不會重新整理</b>，所以後台登入狀態不會掉。<br>授權完關掉小視窗，狀態就自動更新。若瀏覽器擋彈出視窗，系統會改成整頁導轉，一樣能完成。",
      titleEn: "Connect or switch account",
      descEn: "This opens a small window for Google's authorization. <b>The page itself never reloads</b>, so you stay signed into the admin.<br>Close the window when you are done and the status updates on its own. If the browser blocks popups it falls back to a full-page redirect — same result.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="gcal-disconnect"]',
      title: "換人用之前先登出",
      desc: "要把日曆換成另一個人的帳號，<b>一定要先在這裡登出</b>，否則對方會接到目前這個帳號。<br>會再問一次確認才動手；解除後在重新連結之前，核准預約都<em>不會</em>建立日曆事件。",
      titleEn: "Disconnect before handing over",
      descEn: "To move the calendar to someone else's account you <b>must disconnect here first</b>, or they end up back on the current one.<br>You get one confirmation prompt. Between disconnecting and reconnecting, approved bookings <em>will not</em> create calendar events.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="gcal-shared-note"]',
      title: "共用帳號的交接流程",
      desc: "站長與教練目前共用同一組 Google。交接就兩步：<b>目前的人按登出 → 接手的人按連結</b>，系統會自動改用新帳號，不需要工程師介入。",
      titleEn: "Handing over a shared account",
      descEn: "The site owner and the coach share one Google account. Handover is two steps: <b>the current holder disconnects, then the next one connects</b>. The system switches over by itself — no developer needed.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="gcal-features"]',
      title: "連好之後會自動做的事",
      desc: "這些<b>不用另外設定</b>：核准預約自動建事件、寄日曆邀請給會員、提前一天 email 與 30 分鐘彈窗提醒、附上 Google Meet 連結。<br>最實用的是最後一項——<b>你日曆上的忙碌時段會自動從可預約時間扣掉</b>，不會被重複預約。",
      titleEn: "What runs automatically",
      descEn: "None of this <b>needs extra setup</b>: approving a booking creates the event, members get a calendar invite, reminders go out by email a day ahead and as a popup 30 minutes before, and a Google Meet link is attached.<br>The most useful part is the last one — <b>busy slots on your calendar are taken out of your bookable times</b>, so you cannot be double-booked.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "這頁設定好通常就不用再碰，除非換人使用或授權失效。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "Once this page is set up you rarely touch it again — only when someone else takes over or the authorization expires.<br><b>Every page has a “?” in the bottom-right corner</b> — press it whenever you want the tour again.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>這頁設定好通常就不用再碰，除非換人使用或授權失效。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "To move to another admin page, tap the <b>menu button in the top-left</b> for the full list.<br>Once this page is set up you rarely touch it again — only when someone else takes over or the authorization expires.<br><b>Every page has a “?” in the bottom-right corner</b> — tap it whenever you want the tour again.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
