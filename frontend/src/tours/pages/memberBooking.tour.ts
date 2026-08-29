/**
 * 預約諮詢（/booking）導覽 — 學員視角
 * @module tours/pages/memberBooking.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-booking",
  title: "預約諮詢導覽",

  groups: {
    /**
     * 送出預約的彈窗。導覽會幫你點第一個時段把它打開；
     * 若你還沒選日期（畫面上沒有任何時段可點），這幾步會自動跳過。
     */
    submitForm: {
      open: '[data-tour="booking-slot"]',
      wait: '[data-tour-modal="booking-submit"]',
      // `@/components/ui` 的 Modal 沒有 × 鈕 → 引擎改送 Escape 關閉
    },
  },

  steps: [
    {
      title: "預約教練的諮詢時間",
      desc: "只要三個動作就能約好：<b>選日期 → 選時段 → 填一下想聊什麼</b>。<br>接下來帶你走一遍，隨時可以按右上角 × 離開。",
    },
    {
      el: '[data-tour="booking-header"]',
      title: "先看清楚規則",
      desc: "這一行寫著<b>每次諮詢多久</b>、以及可以約多早、多晚。<br>例如「最短 24 小時前預約」就代表<em>今天想約今天</em>是不行的。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="booking-calendar"]',
      title: "第一步：挑日期",
      desc: "月曆上<em>金色比較亮</em>的日期才有空檔，灰掉的代表教練當天沒開放或已被約滿。<br>點一下有空的日期，右邊就會列出當天的時段。",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="booking-slots"]',
      title: "第二步：挑時段",
      desc: "選好日期後，可預約的開始時間會列在這裡。<b>點下去就會跳出申請表單</b>，還沒真的送出，可以放心點。<br>如果顯示「該日無可預約時段」，換一天試試。",
      side: "top",
      align: "start",
    },

    // ── 以下步驟在「送出預約」彈窗內 ──
    {
      group: "submitForm",
      el: '[data-tour="booking-form-slot"]',
      title: "確認一下時段",
      desc: "這裡再顯示一次你點到的<b>日期、開始時間與時長</b>。點錯的話按下方「取消」回去重選就好。",
      side: "bottom",
      align: "start",
    },
    {
      group: "submitForm",
      el: '[data-tour="booking-form-course"]',
      title: "想聊哪一門課？",
      desc: "<b>選填</b>。如果你是為了某堂課想問問題，選起來教練會先做功課；只是想聊聊體態或訓練規劃，留「不指定」也完全沒問題。",
      side: "bottom",
      align: "start",
    },
    {
      group: "submitForm",
      el: '[data-tour="booking-form-note"]',
      title: "先說說你的狀況",
      desc: "<b>選填但很推薦</b>。寫下你的目標、遇到的困難或想問的問題，教練在諮詢前就能準備，<em>三十分鐘會更有收穫</em>。",
      side: "top",
      align: "start",
    },
    {
      group: "submitForm",
      el: '[data-tour="booking-form-contact"]',
      title: "留下聯絡方式",
      desc: "已經幫你帶入註冊時的資料，可以直接改。<b>Email 與電話至少要留一個</b>——教練確認或改期時會從這裡通知你。",
      side: "top",
      align: "start",
    },
    {
      group: "submitForm",
      el: '[data-tour="booking-form-submit"]',
      title: "送出申請",
      desc: "按下去只是<b>送出申請</b>，還不算約成。狀態會先變成<em>待確認</em>，等教練點頭之後你會收到 email 通知。",
      side: "top",
      align: "end",
    },

    // ── 收尾 ──
    {
      el: '[data-tour="booking-my-link"]',
      title: "之後去哪裡看？",
      desc: "送出後會自動帶你到<b>我的預約</b>，之後想確認進度或臨時要取消，也是從這個連結進去。<br>需要再看一次教學，按右下角的「<b>?</b>」就好。",
      side: "top",
      align: "start",
    },
  ],
};

export default tour;
