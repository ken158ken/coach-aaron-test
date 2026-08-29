/**
 * 我的預約（/my-bookings）導覽 — 學員視角
 * @module tours/pages/memberMyBookings.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-my-bookings",
  title: "我的預約導覽",

  steps: [
    {
      title: "我的預約",
      desc: "你送出過的每一筆諮詢申請都收在這一頁：<b>約在什麼時候、教練同意了沒、還能不能取消</b>，看這裡就知道。",
    },
    {
      el: '[data-tour="mybookings-new"]',
      title: "再約一場",
      desc: "想加約其他時段，從這裡回到預約頁挑日期。<br>同一個時段<b>不會被重複預約</b>，被別人搶先的話月曆上就不會亮了。",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="mybookings-list"]',
      title: "申請一覽",
      desc: "所有申請由<b>新到舊</b>排列，包含已完成與已取消的紀錄，方便你回頭查上次是什麼時候聊的。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="mybookings-status"]',
      title: "狀態代表什麼",
      desc: "<b>待確認</b>＝已送出、等教練回覆；<b>已確認</b>＝約定成立，記得準時；<b>已拒絕</b>＝教練當天無法，換個時段再約；<b>已取消</b>／<b>已完成</b>則是歷史紀錄。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="mybookings-card"]',
      title: "卡片裡的細節",
      desc: "這裡會顯示你當初填的<b>諮詢內容</b>與關聯課程，教練若有回覆會以<em>教練備註</em>呈現——像是改期建議或要你先準備的東西，記得看一下。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="mybookings-cancel"]',
      title: "臨時不能來？",
      desc: "只有<b>待確認</b>與<b>已確認</b>的預約才會出現這顆鈕。按下去會再問一次確認才真的取消，<em>取消後無法復原</em>，要重新預約才行。",
      side: "left",
      align: "start",
    },
    {
      title: "就這樣！",
      desc: "臨時狀況趕不上，<b>越早取消越好</b>，時段才能讓給其他學員。<br>需要再看一次教學，按右下角的「<b>?</b>」就好。",
    },
  ],
};

export default tour;
