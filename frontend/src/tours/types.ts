/**
 * 新手教學引導 — 型別定義
 * @module tours/types
 *
 * @description
 * 每一頁的導覽都是一份 `TourDefinition`：一串 `TourStep`，
 * 加上可選的 `groups`（描述「這幾步在哪個 modal 裡、怎麼開、怎麼關」）。
 *
 * 設計原則：
 *  1. 步驟定義是**純資料**，不 import React、不碰頁面 state ——
 *     開 modal 一律用「點畫面上那顆按鈕」的方式（`groups[x].open` 選擇器），
 *     所以新增一頁導覽不需要改該頁的邏輯，只要補 `data-tour` 屬性。
 *  2. 元素定位一律用 `[data-tour="..."]`，比 class selector 穩定，
 *     重構樣式不會讓導覽壞掉。
 *  3. 任何步驟找不到目標元素都是**安靜跳過**，不中斷導覽、不報錯。
 */

/** popover 相對於目標元素的方位 */
export type TourSide = "top" | "right" | "bottom" | "left";

/** popover 沿著該方位的對齊方式 */
export type TourAlign = "start" | "center" | "end";

/**
 * 一個「modal 群組」：描述某幾個步驟所處的彈窗要怎麼開、怎麼關。
 *
 * 導覽走到屬於此群組的步驟時會自動點 `open`（手機版優先用 `openMobile`），
 * 等 `wait` 出現後才繼續；離開群組或導覽結束時點 `close` 收掉。
 * 開不起來（按鈕不存在、彈窗沒出現）→ 整組步驟安靜跳過。
 */
export interface TourModalGroup {
  /** 點此選擇器開啟彈窗（例如「新增課程」按鈕） */
  open: string;
  /** 手機版改點的選擇器；省略則沿用 `open` */
  openMobile?: string;
  /** 彈窗開啟成功的判定依據（等這個選擇器出現） */
  wait: string;
  /** 關閉彈窗的選擇器；省略則送 Escape */
  close?: string;
}

/** 導覽中的單一步驟 */
export interface TourStep {
  /**
   * 目標元素選擇器（慣例：`[data-tour="xxx"]`）。
   * 省略 = 畫面正中央的說明卡，適合開場白／結語。
   */
  el?: string;
  /** 手機版改用的選擇器（版面不同時）；省略則沿用 `el` */
  elMobile?: string;
  /** 標題（繁體中文，簡短有力） */
  title: string;
  /** 說明內容，可含少量 HTML（`<b>`、`<br>`、`<code>`） */
  desc: string;
  /** popover 方位 */
  side?: TourSide;
  /** popover 對齊 */
  align?: TourAlign;
  /** 只在桌機／只在手機顯示這一步 */
  only?: "desktop" | "mobile";
  /** 這一步位於哪個 modal 群組內（對應 `TourDefinition.groups` 的 key） */
  group?: string;
}

/** 一頁的完整導覽定義 */
export interface TourDefinition {
  /** 唯一 id，也用來記「這頁看過導覽沒」 */
  id: string;
  /** 導覽名稱（用於 aria-label 與除錯） */
  title: string;
  /** 步驟列表 */
  steps: TourStep[];
  /** modal 群組定義 */
  groups?: Record<string, TourModalGroup>;
}

/** 已依裝置解析過的步驟（引擎內部用） */
export interface ResolvedStep {
  step: TourStep;
  selector?: string;
}
