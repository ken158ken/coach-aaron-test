/**
 * 儀表板（/admin）導覽 — 兼作整個後台的入門說明
 * @module tours/pages/adminDashboard.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-dashboard",
  title: "後台入門導覽",

  steps: [
    {
      title: "歡迎進入管理後台",
      desc: "這是你的<b>指揮中心</b>：網站的內容、學員與營收都從這裡管理。<br>先花一分鐘認識版面，之後每一頁右下角都能再叫出導覽。",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "左側是所有管理頁",
      desc: "整個後台分成三塊：<b>賣什麼</b>（課程、影片、教學）、<b>寫什麼</b>（文章、內容、活動頁）、<b>誰能用</b>（用戶、白名單）。<br>找不到功能時，先想它屬於哪一塊。",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="admin-sidebar-toggle"]',
      title: "叫出管理選單",
      desc: "手機版側邊欄預設收起來，按這顆就會滑出所有管理頁；點完連結會自動收合，不擋畫面。",
      side: "bottom",
      align: "start",
      only: "mobile",
    },
    {
      el: '[data-tour="admin-nav-courses"]',
      title: "內容經營區",
      desc: "課程、Reels、教學影片、文章、活動頁都在這一段。<b>要讓前台多出東西</b>，都是從這幾頁新增。",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="admin-nav-users"]',
      title: "人員與權限區",
      desc: "<b>用戶</b>是註冊的學員資料；<b>白名單</b>決定誰能登入這個後台。<br>權限出問題時來這兩頁看，不要直接改資料庫。",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="dashboard-primary-stats"]',
      title: "四個核心指標",
      desc: "每天開工先掃一眼這排：數字底下的<em>小字</em>是同期補充（本月新增幾人、累積幾次閱覽），比單看總數更有意義。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="dashboard-stat-revenue"]',
      title: "本月營收怎麼看",
      desc: "只累計<b>當月</b>已成立的訂單，每月一號歸零。<br>營收沒動但訂單筆數有增加，通常是有訂單卡在未付款。",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="dashboard-content-stats"]',
      title: "內容存量與預約",
      desc: "這排看的是<b>庫存</b>：影片與教學夠不夠、預約諮詢排了幾筆。數字長期不動，代表該補內容了。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="dashboard-rankings"]',
      title: "三張排行榜",
      desc: "文章比<b>閱覽</b>、教學影片比<b>觀看</b>、課程比<b>報名人數</b>。<br>排前面的題材值得再多做幾支；長期墊底的可以考慮下架或改標題。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="dashboard-analytics"]',
      title: "訪客流量看這裡",
      desc: "本頁只統計<b>站內資料</b>。想知道有多少人來、從哪來、停多久，要去 <code>Google Analytics</code> 或 Vercel Analytics。<br>導覽結束了——每頁右下角的「?」隨時可以再看一次。",
      side: "top",
      align: "start",
    },
  ],
};

export default tour;
