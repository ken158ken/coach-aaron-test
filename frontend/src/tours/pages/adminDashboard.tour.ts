/**
 * 儀表板（/admin）導覽 — 兼作整個後台的入門說明
 * @module tours/pages/adminDashboard.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-dashboard",
  title: "後台入門導覽",
  titleEn: "Admin starter tour",

  steps: [
    {
      title: "歡迎進入管理後台",
      desc: "這是你的<b>指揮中心</b>：網站的內容、學員與營收都從這裡管理。<br>先花一分鐘認識版面，之後每一頁右下角都能再叫出導覽。",
      titleEn: "Welcome to the admin",
      descEn: "This is your <b>command center</b> — the site's content, users, and revenue are all run from here.<br>Take a minute to learn the layout; every page can call this tour back from its bottom-right corner.",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "左側是所有管理頁",
      desc: "整個後台分成三塊：<b>賣什麼</b>（課程、影片、教學）、<b>寫什麼</b>（文章、內容、活動頁）、<b>誰能用</b>（用戶、白名單）。<br>找不到功能時，先想它屬於哪一塊。",
      titleEn: "Every admin page lives here",
      descEn: "The admin splits into three parts: <b>what you sell</b> (courses, Reels, lessons), <b>what you write</b> (articles, content, landing pages), and <b>who gets in</b> (users, whitelist).<br>Can't find a feature? Work out which part it belongs to first.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="admin-sidebar-toggle"]',
      title: "叫出管理選單",
      desc: "手機版側邊欄預設收起來，按這顆就會滑出所有管理頁；點完連結會自動收合，不擋畫面。",
      titleEn: "Open the admin menu",
      descEn: "On mobile the sidebar starts collapsed. Tap here to slide out every admin page; it closes itself once you pick a link, so it never blocks the view.",
      side: "bottom",
      align: "start",
      only: "mobile",
    },
    {
      el: '[data-tour="admin-nav-courses"]',
      title: "內容經營區",
      desc: "課程、Reels、教學影片、文章、活動頁都在這一段。<b>要讓前台多出東西</b>，都是從這幾頁新增。",
      titleEn: "Where content is made",
      descEn: "Courses, Reels, lessons, articles, and landing pages all sit in this block. <b>Anything new on your public site</b> starts on one of these pages.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="admin-nav-users"]',
      title: "人員與權限區",
      desc: "<b>用戶</b>是註冊的學員資料；<b>白名單</b>決定誰能登入這個後台。<br>權限出問題時來這兩頁看，不要直接改資料庫。",
      titleEn: "People and access",
      descEn: "<b>Users</b> holds the records of registered students; <b>Whitelist</b> decides who can log into this admin.<br>When access misbehaves, start on these two pages — never edit the database directly.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="dashboard-primary-stats"]',
      title: "四個核心指標",
      desc: "每天開工先掃一眼這排：數字底下的<em>小字</em>是同期補充（本月新增幾人、累積幾次閱覽），比單看總數更有意義。",
      titleEn: "Your four key numbers",
      descEn: "Scan this row first thing each day. The <em>small print</em> under each number is the comparison — new users this month, total views to date — and it tells you far more than the running total alone.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="dashboard-stat-revenue"]',
      title: "本月營收怎麼看",
      desc: "只累計<b>當月</b>已成立的訂單，每月一號歸零。<br>營收沒動但訂單筆數有增加，通常是有訂單卡在未付款。",
      titleEn: "How this month's revenue works",
      descEn: "It counts only confirmed orders from <b>the current month</b> and resets on the 1st.<br>Revenue flat while the order count climbs usually means orders are stuck unpaid.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="dashboard-content-stats"]',
      title: "內容存量與預約",
      desc: "這排看的是<b>庫存</b>：影片與教學夠不夠、預約諮詢排了幾筆。數字長期不動，代表該補內容了。",
      titleEn: "Content stock and bookings",
      descEn: "This row is your <b>inventory</b>: whether you have enough Reels and lessons, and how many consultations are booked. If these numbers sit still for weeks, it's time to add content.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="dashboard-rankings"]',
      title: "三張排行榜",
      desc: "文章比<b>閱覽</b>、教學影片比<b>觀看</b>、課程比<b>報名人數</b>。<br>排前面的題材值得再多做幾支；長期墊底的可以考慮下架或改標題。",
      titleEn: "Three leaderboards",
      descEn: "Articles rank by <b>views</b>, lessons by <b>watches</b>, courses by <b>signups</b>.<br>Topics at the top deserve a few more; anything stuck at the bottom is worth retitling or retiring.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="dashboard-analytics"]',
      title: "訪客流量看這裡",
      desc: "本頁只統計<b>站內資料</b>。想知道有多少人來、從哪來、停多久，要去 <code>Google Analytics</code> 或 Vercel Analytics。<br>導覽結束了——每頁右下角的「?」隨時可以再看一次。",
      titleEn: "Where traffic data lives",
      descEn: "This page counts <b>on-site data</b> only. For how many people came, where from, and how long they stayed, go to <code>Google Analytics</code> or Vercel Analytics.<br>That's the tour — the ? in the bottom-right corner of every page brings it back.",
      side: "top",
      align: "start",
    },
  ],
};

export default tour;
