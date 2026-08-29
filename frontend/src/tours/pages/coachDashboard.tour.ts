/**
 * 教練儀表板（/coach）導覽
 * @module tours/pages/coachDashboard.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "coach-dashboard",
  title: "教練儀表板導覽",

  groups: {
    /** 審核彈窗——點第一張待審核卡片開啟，沒有 × 鈕，用 Escape 收掉 */
    review: {
      open: '[data-tour="coach-pending-card"]',
      wait: '[data-tour-modal="coach-review"]',
    },
    /**
     * 「時段設定」分頁——用同一套機制切分頁：
     * 點分頁鈕當「開啟」，等面板出現，離開時點回「待審核」分頁還原。
     */
    schedule: {
      open: '[data-tour="coach-tab-schedule"]',
      wait: '[data-tour="coach-schedule-panel"]',
      close: '[data-tour="coach-tab-pending"]',
    },
    /** 「Google 日曆」分頁，作法同上 */
    google: {
      open: '[data-tour="coach-tab-google"]',
      wait: '[data-tour="coach-google-panel"]',
      close: '[data-tour="coach-tab-pending"]',
    },
  },

  steps: [
    {
      title: "教練儀表板",
      desc: "學員的預約審核、每週可預約時段、休假，以及 Google 日曆同步，全部集中在這一頁。<br>接下來會自動幫你切分頁示範，隨時可以按右上角 × 離開。",
    },
    {
      el: '[data-tour="coach-tabs"]',
      title: "四個分頁",
      desc: "<b>待審核</b>括號內的數字就是等你回覆的件數；<b>全部預約</b>看歷史紀錄與 Google 同步狀態；<b>時段設定</b>決定學員能約哪些時間；<b>Google 日曆</b>負責雙向避開你的行程。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="coach-pending-list"]',
      title: "待審核預約",
      desc: "學員送出的預約會停在這裡等你決定，<b>在你按下批准之前不會佔用時段</b>。<br>整張卡片都能點，點下去就進審核畫面。",
      side: "top",
      align: "start",
    },
    {
      group: "review",
      el: '[data-tour="coach-review-note"]',
      title: "批註欄",
      desc: "這段文字<b>會一併通知學員</b>。批准時可以補上「請提早十分鐘到」之類的提醒；<em>拒絕時務必說明理由</em>或提出替代時段，體驗差很多。",
      side: "bottom",
      align: "start",
    },
    {
      group: "review",
      el: '[data-tour="coach-review-actions"]',
      title: "批准或拒絕",
      desc: "<b>批准 + 同步 Google</b> 會確認時段並直接在你的日曆建立事件；<b>拒絕</b>把時段釋放回去讓別人能約。<br>還沒想好就按<b>返回</b>，預約會留在待審核。",
      side: "top",
      align: "end",
    },
    {
      group: "schedule",
      el: '[data-tour="coach-profile-settings"]',
      title: "預約基本規則",
      desc: "<b>諮詢時長</b>決定每個時段多長；<b>前置時間</b>擋掉臨時預約（例如 24 小時內不可約）；<b>可訂範圍</b>是最多能提前幾天。<br>這幾格<b>離開欄位就自動存檔</b>，不用按儲存。<br>右下的開關可以整個<em>暫停開放預約</em>。",
      side: "bottom",
      align: "start",
    },
    {
      group: "schedule",
      el: '[data-tour="coach-add-rule"]',
      title: "每週可預約時段",
      desc: "這裡設的是<b>每週固定重複</b>的規則，例如「週三 14:00–18:00」，系統會依諮詢時長自動切成一格一格給學員挑。<br>同一天想分上下午，就<b>建兩條規則</b>。",
      side: "left",
      align: "start",
    },
    {
      group: "schedule",
      el: '[data-tour="coach-add-timeoff"]',
      title: "休假區間",
      desc: "連假、出國、受訓就在這裡開一段休假，<b>優先權高於每週規則</b>——期間內即使符合規則也約不到。<br>臨時有事請個假比刪規則安全，回來不用重設。",
      side: "left",
      align: "start",
    },
    {
      group: "google",
      el: '[data-tour="coach-google-panel"]',
      title: "Google 日曆同步",
      desc: "連結之後有兩個好處：可預約時段會<b>自動避開</b>你日曆上已有的行程，批准預約時也會<b>自動建立事件</b>。<br>看到「Token 失效」就按<b>重新連結</b>一次即可。",
      side: "bottom",
      align: "start",
    },
    {
      title: "導覽完成",
      desc: "建議的順序是：先把<b>時段設定</b>調好、連上 <b>Google 日曆</b>，之後每天只要顧<b>待審核</b>就行。<br>右下角的「?」隨時可以再叫出這份導覽。",
    },
  ],
};

export default tour;
