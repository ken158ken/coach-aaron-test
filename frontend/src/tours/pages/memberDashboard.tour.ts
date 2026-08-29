/**
 * 學員儀表板（/dashboard）導覽
 * @module tours/pages/memberDashboard.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-dashboard",
  title: "學員儀表板導覽",
  titleEn: "Training dashboard tour",

  steps: [
    {
      title: "這是你的訓練首頁",
      desc: "每次登入先來這裡：<b>看看自己練到哪</b>、接著上次的課繼續，或直接跳去約課、找教練。<br>三十秒帶你逛完，按右上角 × 可以隨時離開。",
      titleEn: "Your training home",
      descEn: "Start here every time you sign in: <b>see how far you have come</b>, pick up the lesson you left off, or jump straight to booking or messaging your coach.<br>Thirty seconds to look around — the × in the top right leaves any time.",
    },
    {
      el: '[data-tour="dash-stats"]',
      title: "四個進度數字",
      desc: "本週進度、完成課堂、累計分鐘、連續天數。<br>數字下面的<em>小箭頭</em>是跟上週比較——往下不用緊張，代表<b>該回來動一動了</b>。",
      titleEn: "Four progress numbers",
      descEn: "This week's progress, lessons finished, total minutes, and your day streak.<br>The <em>small arrow</em> under each one compares against last week. A downward arrow is nothing to panic about — it just means <b>it's time to get moving again</b>.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="dash-recent"]',
      title: "繼續學習",
      desc: "最近上過的課會排在這裡，<b>點一下就從上次的地方接下去</b>，不用自己找進度。<br>下面那條金色的線就是你這門課的完成度。",
      titleEn: "Pick up where you left off",
      descEn: "Your recent lessons line up here — <b>one tap resumes exactly where you stopped</b>, no hunting for your place.<br>The gold bar underneath is how far through that course you are.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="dash-actions"]',
      title: "快速操作",
      desc: "右邊這一區是四個最常用的去處，<b>不用回首頁再找選單</b>。",
      titleEn: "Quick actions",
      descEn: "The four places you go most often, over on the right — <b>no going back to the home page to find a menu</b>.",
      side: "left",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="dash-actions"]',
      title: "快速操作",
      desc: "往下捲就是四個最常用的去處，<b>不用回首頁再找選單</b>。",
      titleEn: "Quick actions",
      descEn: "Scroll down for the four places you go most often — <b>no going back to the home page to find a menu</b>.",
      side: "top",
      align: "start",
      only: "mobile",
    },
    {
      el: '[data-tour="dash-action-courses"]',
      title: "逛課程、看影片",
      desc: "還沒開始上課、或想加購新課程，從<b>瀏覽課程</b>進去看看。<br>下面的<b>觀看影片</b>則是免費的教學片段，想先試試看再決定的話很適合。",
      titleEn: "Browse courses and videos",
      descEn: "Not training yet, or after another course? <b>Browse Courses</b> is where to look.<br><b>Watch Videos</b> below it holds the free lesson clips — a good way to try before you buy.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="dash-action-member"]',
      title: "會員中心",
      desc: "換頭貼、改顯示名稱、換密碼，還有把跟教練的對話<b>下載存檔</b>，都在會員中心那一頁。",
      titleEn: "Member Center",
      descEn: "Your avatar, display name, password, and <b>downloading your chats with the coach</b> all live on the Member Center page.",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="dash-action-contact"]',
      title: "聯絡教練",
      desc: "動作不確定、菜單想調整、或想約下一堂課，直接從這裡留言給教練。<br><b>問問題永遠不嫌多</b>，教練看到會回覆你。",
      titleEn: "Message your coach",
      descEn: "Unsure about a movement, want your program adjusted, or ready to book the next session? Message the coach straight from here.<br><b>No question is too small</b> — he'll reply once he sees it.",
      side: "left",
      align: "start",
    },
    {
      title: "開始今天的訓練吧",
      desc: "忘了哪個功能在哪，<b>右下角的「?」</b>按下去就能再看一次這份導覽。<br>每一頁都有各自的說明，隨時可以叫出來。",
      titleEn: "Go train",
      descEn: "Lost track of where something lives? The <b>? button in the bottom right</b> replays this tour.<br>Every page has one of its own, ready whenever you want it.",
    },
  ],
};

export default tour;
