/**
 * Google 日曆管理（/admin/google-calendar）導覽
 * @module tours/pages/adminGoogleCalendar.tour
 *
 * 這頁已從「只管帳號連結」升級成完整日曆，導覽的重點也跟著換：
 * 連結設定只留一步（它現在收在頁頂摺疊卡裡，設好就不用再碰），
 * 其餘篇幅給每天真的會用到的操作——新增、拖拉改期，以及
 * 「動到會員預約會連帶通知對方」這件必須講清楚的事。
 *
 * `gcal-toolbar` / `gcal-views` 兩個錨點是 CalendarSurface 在 mount 後
 * 蓋到 FullCalendar 自己畫的工具列上的（套件內部 DOM 沒地方寫屬性）。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-google-calendar",
  title: "Google 日曆管理導覽",
  titleEn: "Google Calendar tour",

  steps: [
    {
      title: "這裡就是你的 Google 日曆",
      desc: "這一頁跟你直接開 Google 日曆幾乎一樣：<b>看得到所有活動、可以自由新增、修改、刪除、拖拉改時間</b>，改動會即時同步回 Google。<br>下面帶你走一遍最常用的幾個動作。",
      titleEn: "This is your Google Calendar",
      descEn: "This page behaves almost exactly like Google Calendar itself: <b>every event is here, and you can add, edit, delete and drag things around freely</b> — changes sync straight back to Google.<br>Here's a quick pass over what you'll use most.",
    },
    {
      el: '[data-tour="gcal-connection"]',
      title: "帳號連結收在這裡",
      desc: "右邊的小圓標告訴你現在是<b>已連結 / 未連結 / 連結已失效</b>。<br>點一下這一列可以展開，裡面就是原本的「連結 / 切換 Google 帳號」與「登出 / 解除連結」。<br>換人使用時要<b>先登出、再讓對方連結</b>；平常設好就不用再打開。",
      titleEn: "Account settings live here",
      descEn: "The little pill on the right tells you whether you're <b>connected, not connected, or expired</b>.<br>Click the row to expand it — inside are the same “connect / switch Google account” and “sign out / disconnect” controls as before.<br>To hand over to someone else, <b>disconnect first, then let them connect</b>. Otherwise you can leave it closed.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="gcal-views"]',
      elMobile: '[data-tour="gcal-toolbar"]',
      title: "切換月 / 週 / 日視圖",
      desc: "右上角切視圖：<b>月</b>看整體排程、<b>週 / 日</b>看得到每個小時的細節、<b>列表</b>純文字條列最適合手機。<br>左上角的箭頭往前往後翻，「今天」一鍵跳回今天。<br>每次翻頁都會自動去 Google 重抓那一段時間的活動。",
      titleEn: "Switch month / week / day",
      descEn: "Change the view from the top-right: <b>month</b> for the big picture, <b>week or day</b> when you need the hour-by-hour detail, <b>list</b> for a plain rundown that reads best on a phone.<br>The arrows on the left move back and forward; “today” jumps straight back.<br>Every time you move, the events for that stretch are pulled fresh from Google.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="gcal-new"]',
      title: "新增活動的兩種方式",
      desc: "按這顆會開一張空白的活動表單（標題、全天、起訖時間、地點、描述，還可以勾<b>附加 Google Meet 連結</b>）。<br>更快的做法是<b>直接在日曆上點一格空白，或按住往下拖出一段時間</b>——表單會自動帶好你選的時段。",
      titleEn: "Two ways to add an event",
      descEn: "This button opens a blank event form — title, all-day toggle, start and end, location, description, and an option to <b>attach a Google Meet link</b>.<br>The quicker way: <b>click an empty slot on the calendar, or drag down over a stretch of time</b>, and the form opens with those times already filled in.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="gcal-grid"]',
      title: "點開來看、拖著就改期",
      desc: "<b>點任何一個活動</b>會開詳情：時間、地點、描述、Meet 連結，還有「在 Google 日曆開啟」，也可以直接編輯或刪除。<br><b>把活動拖到別的日子或時段就是改期</b>；在週/日視圖拉事件的上下邊緣可以改長度。改完立刻寫回 Google，失敗會自動彈回原位。",
      titleEn: "Click to inspect, drag to reschedule",
      descEn: "<b>Click any event</b> to see its details — time, location, description, Meet link, and a shortcut to open it in Google Calendar. You can edit or delete it from there too.<br><b>Dragging an event to another day or time reschedules it</b>, and in week/day view you can drag its top or bottom edge to change how long it runs. Everything is written straight back to Google; if it fails, the event snaps back on its own.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="gcal-legend"]',
      elMobile: '[data-tour="gcal-actions"]',
      title: "金色外框 = 會員的預約",
      desc: "帶金色外框和「會員預約」徽章的，是<b>學員自己約的時段</b>，跟你自己排的活動不一樣：<br>· <b>改時間</b> → 會員那筆預約一起改，系統會通知對方<br>· <b>刪除</b> → 等於幫會員取消預約，也會發出取消通知<br>所以這兩個動作都會先跳確認框問你一次，看清楚再按。",
      titleEn: "Gold outline means a member booked it",
      descEn: "Anything with a gold outline and a “member booking” badge was <b>booked by a student</b>, and it doesn't behave like your own events:<br>· <b>Change the time</b> → their booking moves with it and they get notified<br>· <b>Delete it</b> → that cancels their booking, and a cancellation notice goes out<br>Both actions ask you to confirm first, so read the prompt before you commit.",
      side: "top",
      align: "end",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "日常就三件事：<b>翻視圖看排程、點空白新增、拖著改期</b>。<br>帳號連結那張卡設好幾乎不用再碰，除非換人使用或授權失效。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "Day to day it's three things: <b>switch views to scan your schedule, click empty space to add, drag to reschedule</b>.<br>The connection card is set-and-forget unless someone else takes over or the authorization expires.<br><b>Every page has a “?” in the bottom-right corner</b> — press it whenever you want the tour again.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "手機版預設是<b>列表週視圖</b>，最好讀；要看月曆就從工具列切過去。<br>要換到其他管理頁，按<b>左上角這顆選單鈕</b>會滑出完整清單。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "On a phone this opens in <b>list view for the week</b>, which reads best; switch to the month grid from the toolbar when you need it.<br>To move to another admin page, tap the <b>menu button in the top-left</b> for the full list.<br><b>Every page has a “?” in the bottom-right corner</b> — tap it whenever you want the tour again.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
