/**
 * 意見反饋（/feedback）導覽 — 學員視角
 * @module tours/pages/memberFeedback.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-feedback",
  title: "意見反饋導覽",
  titleEn: "Feedback tour",

  steps: [
    {
      title: "意見反饋",
      desc: "有問題、想法、或發現哪裡怪怪的？都能在這頁告訴教練。<b>一則反饋就是一段對話</b>，教練回覆後你可以繼續追問，像聊天一樣一來一往。",
      titleEn: "Feedback",
      descEn: "Got a question, an idea, or spotted something odd? Tell your coach right here. <b>Each piece of feedback is its own conversation</b> — once the coach replies you can keep going, just like chatting.",
    },
    {
      el: '[data-tour="feedback-new"]',
      title: "開一則新反饋",
      desc: "點這裡填<b>標題＋內容</b>，還能<b>附上圖片</b>——最方便的是直接<em>貼上剪貼簿的截圖</em>（Ctrl/⌘ + V），或把圖片拖進來。原圖不會被壓縮，截圖看得清清楚楚。",
      titleEn: "Start a new one",
      descEn: "Tap here to add a <b>title and details</b>, and <b>attach images</b> — easiest is to <em>paste a screenshot straight from your clipboard</em> (Ctrl/⌘ + V) or drag one in. Images aren't compressed, so screenshots stay crisp.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="feedback-search"]',
      title: "找回舊反饋",
      desc: "反饋變多時，用標題關鍵字<b>快速搜尋</b>，不用一張張卡片翻。",
      titleEn: "Find an old one",
      descEn: "When they pile up, <b>search by title keyword</b> instead of scrolling every card.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="feedback-list"]',
      title: "你的反饋牆",
      desc: "所有反饋依<b>最後更新時間</b>排列，最新的在最前面。有附圖的卡片右下角會出現<b>縮圖</b>。",
      titleEn: "Your feedback wall",
      descEn: "Everything is ordered by <b>last update</b>, newest first. Cards with an image show a <b>thumbnail</b> in the corner.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="feedback-card"]',
      title: "看懂一張卡片",
      desc: "左上角的<b>狀態標籤</b>告訴你進度：<em>等待教練回應</em>＝球在教練那邊；<em>等待你回應</em>＝換你了；還有<em>處理中</em>與<em>已完成</em>。點卡片就能進去看完整對話。",
      titleEn: "Reading a card",
      descEn: "The <b>status label</b> top-left shows progress: <em>Waiting on coach</em> means the ball's in his court; <em>Waiting on you</em> means it's your turn; plus <em>In progress</em> and <em>Resolved</em>. Tap a card to open the full conversation.",
      side: "top",
      align: "start",
    },
    {
      title: "在對話裡",
      desc: "進到一則反饋後，訊息以氣泡呈現——<b>你在右邊、教練在左邊</b>。點圖片可放大看原圖；<b>你自己傳的訊息</b>可以隨時<em>編輯或刪除</em>。底部輸入列同樣支援貼上截圖。",
      titleEn: "Inside a conversation",
      descEn: "Open a thread and messages appear as bubbles — <b>you on the right, the coach on the left</b>. Tap an image to view it full size; <b>your own messages</b> can be <em>edited or deleted</em> anytime. The reply box also takes pasted screenshots.",
    },
    {
      title: "就這樣！",
      desc: "想到什麼就記下來，教練會盡快回覆你。<br>需要再看一次教學，按右下角的「<b>?</b>」就好。",
      titleEn: "That's it",
      descEn: "Jot things down whenever they come up — your coach will reply as soon as he can.<br>Want this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
