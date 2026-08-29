/**
 * 新手教學引導 — 執行引擎（**僅在 client 端載入**）
 * @module tours/engine/tourEngine
 *
 * @description
 * 這個模組直接 `import` driver.js 與它的 CSS，因此**絕對不可以**被 SSR 期間執行到。
 * 唯一的進入方式是 `useTour.ts` 裡的 `await import("./engine/tourEngine")`——
 * Vite 會把 driver.js + driver.css + tour.css 打成一個 async chunk，
 * 只有使用者真的按下「?」時才下載，SSR bundle 也不會去執行它。
 *
 * 引擎在 driver.js 之上補了三件事：
 *  1. **RWD**：依 `isMobile` 挑 `elMobile` / 過濾 `only` 步驟。
 *  2. **modal 導覽**：走到 `group` 步驟時自動點開對應彈窗、等它出現；
 *     離開群組或導覽結束時自動關閉。
 *  3. **容錯**：任何找不到的元素／開不起來的彈窗都往下一步跳，永不 throw。
 */

import { driver, type Config, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "../tour.css";
import type { ResolvedStep, TourDefinition } from "../types";

/** popover 額外掛的 class，用來提高 CSS 覆寫的優先權 */
const POPOVER_CLASS = "aaron-tour";

/**
 * 聚焦元素的標記屬性。
 *
 * driver.js 自己會在被聚焦的元素上加 `.driver-active-element` class，但那個 class
 * 撐不過 React 的重繪：`className` 是 React 管理的 prop，元件一旦重新渲染就會被
 * 覆寫回去，金色外框因此會時有時無（在 modal 裡特別明顯，表單每打一個字就重繪）。
 * 改用自訂 data 屬性就穩了 —— React 不會去動它沒設定過的屬性。
 * 挖洞的遮罩是 driver 依元素座標畫的，不受影響；這裡補的只是外框。
 */
const ACTIVE_ATTR = "data-tour-active";

/** driver.js 給「置中說明卡」用的假元素，不該被畫外框 */
const DUMMY_ID = "driver-dummy-element";

function clearActiveMark(): void {
  document
    .querySelectorAll(`[${ACTIVE_ATTR}]`)
    .forEach((n) => n.removeAttribute(ACTIVE_ATTR));
}

/** 等待元素出現的上限（ms）——涵蓋 modal 的進場動畫與資料載入 */
const WAIT_APPEAR_MS = 3000;
/** 等待元素消失的上限（ms） */
const WAIT_GONE_MS = 1200;
/** 彈窗出現後額外的緩衝，讓 framer-motion 的位移動畫落定再量測位置 */
const SETTLE_MS = 260;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const q = (sel?: string): HTMLElement | null => {
  if (!sel) return null;
  try {
    return document.querySelector<HTMLElement>(sel);
  } catch {
    // 選擇器寫錯不該炸掉整個導覽
    return null;
  }
};

/** 元素存在且真的看得到（有佔位面積） */
const isVisible = (el: HTMLElement | null): el is HTMLElement => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

/** 輪詢等待選擇器出現且可見 */
async function waitForEl(sel: string, timeout = WAIT_APPEAR_MS): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = q(sel);
    if (isVisible(el)) return el;
    if (Date.now() > deadline) return null;
    await sleep(60);
  }
}

/** 輪詢等待選擇器消失 */
async function waitForGone(sel: string, timeout = WAIT_GONE_MS): Promise<void> {
  const deadline = Date.now() + timeout;
  while (isVisible(q(sel)) && Date.now() < deadline) {
    await sleep(50);
  }
}

/**
 * 送一顆 Escape，給既沒有關閉鈕、也沒有背景遮罩可點的彈窗用。
 *
 * ⚠️ driver.js 自己也在監聽 Escape（`allowKeyboardControl`），一顆合成的 Escape
 * 會同時被彈窗和 driver 收到，結果是「關掉彈窗的同時把整段導覽也關了」。
 * 所以這裡先把 driver 的鍵盤控制暫時關掉——它是在事件發生的當下才讀這個設定，
 * 因此改完立刻生效、事後再還原即可。
 */
function pressEscape(instance: Driver): void {
  const config = instance.getConfig();
  instance.setConfig({ ...config, allowKeyboardControl: false });
  const init: KeyboardEventInit = { key: "Escape", code: "Escape", keyCode: 27, bubbles: true };
  document.dispatchEvent(new KeyboardEvent("keydown", init));
  document.dispatchEvent(new KeyboardEvent("keyup", init));
  instance.setConfig({ ...config, allowKeyboardControl: true });
}

export interface RunTourOptions {
  /** 是否為手機版版面（由 useTour 依 matchMedia 判定） */
  isMobile: boolean;
  /** 導覽結束（完成或中途關閉）時呼叫 */
  onFinish?: () => void;
}

/** `runTour` 的回傳值，讓呼叫端可以在 unmount 時強制收掉 */
export interface TourHandle {
  destroy: () => void;
  isActive: () => boolean;
}

/**
 * 執行一份導覽定義。
 *
 * @param def - 頁面的導覽定義
 * @param options - 裝置資訊與結束 callback
 * @returns 控制把手；沒有任何可用步驟時回傳 null
 */
export function runTour(def: TourDefinition, options: RunTourOptions): TourHandle | null {
  const { isMobile, onFinish } = options;

  // ── 1. 依裝置解析步驟 ──────────────────────────────────
  const resolved: ResolvedStep[] = def.steps
    .filter((s) => !s.only || (s.only === "mobile") === isMobile)
    .map((s) => ({
      step: s,
      selector: isMobile && s.elMobile ? s.elMobile : s.el,
    }));

  // modal 內的步驟現在當然找不到元素（彈窗還沒開），所以只預先剔除
  // 「不在群組內、又確實不存在」的步驟。沒有 selector 的是置中說明卡，保留。
  const steps = resolved.filter(
    (r) => r.step.group || !r.selector || isVisible(q(r.selector)),
  );

  if (steps.length === 0) return null;

  const driveSteps: DriveStep[] = steps.map((r) => ({
    element: r.selector,
    popover: {
      title: r.step.title,
      description: r.step.desc,
      ...(r.selector ? { side: r.step.side ?? "bottom", align: r.step.align ?? "start" } : {}),
    },
  }));

  // ── 2. modal 群組狀態機 ────────────────────────────────
  let openGroup: string | null = null;
  /** 開過但失敗的群組，記下來避免每一步都重試一次（拖慢導覽） */
  const failedGroups = new Set<string>();
  let destroyed = false;
  /** 防止 async 轉場期間使用者連點造成競態 */
  let busy = false;

  /**
   * 關閉目前開著的 modal 群組。三段式，由安全到不得已：
   *  1. 群組指定的關閉鈕（最精準）
   *  2. 彈窗的背景遮罩（`data-tour-modal-backdrop`，共用 Modal 都有）
   *  3. 合成 Escape（會暫時關掉 driver 的鍵盤控制，避免連導覽一起關掉）
   */
  async function closeCurrentGroup(): Promise<void> {
    const name = openGroup;
    if (!name) return;
    openGroup = null;
    const g = def.groups?.[name];
    if (!g) return;

    const closeBtn = q(g.close);
    const backdrop = q("[data-tour-modal-backdrop]");
    if (closeBtn) closeBtn.click();
    else if (backdrop) backdrop.click();
    else pressEscape(instance);

    await waitForGone(g.wait);
  }

  async function ensureGroup(name: string): Promise<boolean> {
    if (openGroup === name) return true;
    if (failedGroups.has(name)) return false;

    const g = def.groups?.[name];
    if (!g) {
      failedGroups.add(name);
      return false;
    }

    await closeCurrentGroup();

    // 彈窗可能本來就開著（使用者自己開的）——那就直接沿用
    if (!isVisible(q(g.wait))) {
      const openSel = isMobile && g.openMobile ? g.openMobile : g.open;
      const btn = q(openSel);
      if (!btn) {
        failedGroups.add(name);
        return false;
      }
      btn.click();
      const appeared = await waitForEl(g.wait);
      if (!appeared) {
        failedGroups.add(name);
        return false;
      }
    }

    await sleep(SETTLE_MS);
    openGroup = name;
    return true;
  }

  // ── 3. 轉場：往 dir 方向找到第一個「真的能導」的步驟 ────
  let current = 0;

  async function goTo(target: number, dir: 1 | -1): Promise<void> {
    if (busy || destroyed) return;
    busy = true;
    try {
      let i = target;
      while (i >= 0 && i < steps.length) {
        const r = steps[i];

        if (r.step.group) {
          const ok = await ensureGroup(r.step.group);
          if (!ok) {
            i += dir;
            continue;
          }
        } else if (openGroup) {
          await closeCurrentGroup();
        }

        if (destroyed) return;

        // 群組開了之後元素才會出現；再給它一點時間（表單分頁、懶載入）
        if (r.selector && !isVisible(q(r.selector))) {
          const found = r.step.group ? await waitForEl(r.selector, 1200) : null;
          if (!found) {
            i += dir;
            continue;
          }
        }

        current = i;
        instance.moveTo(i);
        return;
      }

      // 兩端都走完了 → 結束導覽
      instance.destroy();
    } finally {
      busy = false;
    }
  }

  // ── 4. driver 實例 ────────────────────────────────────
  const config: Config = {
    steps: driveSteps,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    allowKeyboardControl: true,
    overlayColor: "#050505",
    overlayOpacity: 0.74,
    stagePadding: isMobile ? 4 : 8,
    stageRadius: 10,
    popoverClass: POPOVER_CLASS,
    popoverOffset: 12,
    /**
     * 刻意保持 false（預設值）。driver.js 的 `hasNextStep()` 會拿
     * `skipMissingElement` 去掃後面的步驟，開成 true 的話——因為 modal 步驟的
     * 元素此刻本來就不存在——它會誤判「沒有下一步」而把按鈕寫成「完成」。
     * 跳步邏輯由下面的 `goTo()` 自己負責，比 driver 內建的更清楚。
     */
    skipMissingElement: false,
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    progressText: "{{current}} / {{total}}",
    nextBtnText: "下一步",
    prevBtnText: "上一步",
    doneBtnText: "完成",

    // 導覽節奏由我們接管（要先開／關 modal 再移動）
    onNextClick: () => {
      void goTo(current + 1, 1);
    },
    onPrevClick: () => {
      if (current === 0) return;
      void goTo(current - 1, -1);
    },

    onHighlighted: (el) => {
      clearActiveMark();
      if (el instanceof HTMLElement && el.id !== DUMMY_ID) {
        el.setAttribute(ACTIVE_ATTR, "");
      }
    },

    onDeselected: () => {
      clearActiveMark();
    },

    onPopoverRender: (popover) => {
      // 讓關閉鈕有語意標籤；driver.js 預設只有一個 ×
      popover.closeButton.setAttribute("aria-label", "結束導覽");
      popover.wrapper.setAttribute("data-tour-popover", def.id);
    },

    onDestroyed: () => {
      if (destroyed) return;
      destroyed = true;
      clearActiveMark();
      // 導覽結束就把我們開過的彈窗收乾淨
      void closeCurrentGroup().finally(() => onFinish?.());
    },
  };

  const instance: Driver = driver(config);

  // `moveTo()` 不會做初始化（不掛遮罩、不綁鍵盤），所以一定要先 drive() 一次。
  instance.drive(0);
  // 第一步若是 modal 步驟或元素還沒出現，再交給 goTo 補開彈窗／往後找。
  // （慣例上每份導覽的第一步都是置中的歡迎卡，所以這裡通常不會觸發。）
  const first = steps[0];
  if (first.step.group || (first.selector && !isVisible(q(first.selector)))) {
    void goTo(0, 1);
  }

  return {
    destroy: () => {
      if (!destroyed && instance.isActive()) instance.destroy();
    },
    isActive: () => !destroyed && instance.isActive(),
  };
}
