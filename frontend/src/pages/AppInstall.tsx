/**
 * AppInstall - 「變成 APP」安裝教學頁（PWA 加入主畫面）
 * @module pages/AppInstall
 * @description 教使用者把本站加入手機主畫面，像原生 APP 一樣使用。
 *   手機優先版面（PWA 安裝幾乎都發生在手機上）；iOS Safari 與 Android Chrome
 *   兩套圖解步驟；Android 支援 beforeinstallprompt 時顯示一鍵安裝按鈕。
 *   SSR 安全：事件監聽都在 useEffect 內。
 */

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import SEOHead from "@/components/seo/SEOHead";
import {
  BRAND_RED,
  MARK_PATH_D,
  MARK_PLATE_D,
  PLATE_COLOR,
} from "@/components/brand/markPath";

/** beforeinstallprompt 事件（TS lib 未內建） */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** 步驟卡：編號 + 圖示 + 說明 */
const Step: React.FC<{
  no: number;
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
}> = ({ no, icon, title, desc }) => (
  <li className="flex items-start gap-4">
    <span className="shrink-0 w-8 h-8 rounded-full bg-gold/15 border border-gold/40 text-gold text-sm flex items-center justify-center font-medium">
      {no}
    </span>
    <div className="flex-1 min-w-0">
      <p className="flex items-center gap-2 font-medium mb-0.5">
        <span className="text-gold [&_svg]:w-5 [&_svg]:h-5">{icon}</span>
        {title}
      </p>
      <p className="text-sm text-muted leading-relaxed">{desc}</p>
    </div>
  </li>
);

/** iOS 分享圖示（方框 + 上箭頭，Safari 底部那顆） */
const ShareIcon = (
  <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4M6 10v9a2 2 0 002 2h8a2 2 0 002-2v-9" />
  </svg>
);

/** 加入主畫面圖示（方框 + 加號） */
const AddSquareIcon = (
  <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path strokeLinecap="round" d="M12 9v6M9 12h6" />
  </svg>
);

/** Chrome ⋮ 選單圖示 */
const KebabIcon = (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

/** 完成圖示 */
const CheckIcon = (
  <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/** 瀏覽器圖示（地球） */
const GlobeIcon = (
  <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
  </svg>
);

/**
 * 手機主畫面示意圖：畫一支手機，主畫面格子裡有本站的 APP icon。
 * 「圖文並茂」的圖 —— 讓使用者知道完成後長什麼樣子。
 */
const PhoneIllustration: React.FC = () => (
  <svg viewBox="0 0 200 300" className="w-36 sm:w-44 mx-auto" aria-hidden="true">
    {/* 手機外框 */}
    <rect x="30" y="8" width="140" height="284" rx="22" className="fill-surface stroke-gold/40" strokeWidth="2.5" />
    {/* 瀏海 */}
    <rect x="82" y="16" width="36" height="6" rx="3" className="fill-gold/30" />
    {/* 狀態列時間 */}
    <text x="100" y="42" textAnchor="middle" className="fill-gold/60" fontSize="11" fontFamily="inherit">9:41</text>
    {/* 一般 APP 格子（佔位） */}
    {[0, 1, 2].map((row) =>
      [0, 1, 2].map((col) =>
        row === 1 && col === 1 ? null : (
          <rect
            key={`${row}-${col}`}
            x={52 + col * 36}
            y={62 + row * 44}
            width="26"
            height="26"
            rx="7"
            className="fill-gold/10"
          />
        ),
      ),
    )}
    {/* 本站 APP icon（第二排中間，放大突顯）—— 直接內嵌品牌 mark path */}
    <g transform="translate(81, 100)">
      <rect x="-3" y="-3" width="38" height="38" rx="10" className="fill-[#f6f4f0] stroke-gold" strokeWidth="1.5" />
      <g transform={`translate(${1 - 148 * (30 / 692)},${1 - 13 * (30 / 692)}) scale(${30 / 692})`}>
        <path d={MARK_PLATE_D} fill={PLATE_COLOR} fillRule="nonzero" stroke={PLATE_COLOR} strokeWidth={24} strokeLinejoin="round" />
        <path d={MARK_PATH_D} fill={BRAND_RED} fillRule="evenodd" />
      </g>
      <text x="16" y="48" textAnchor="middle" className="fill-gold" fontSize="9">阿倫教官</text>
    </g>
    {/* dock */}
    <rect x="44" y="252" width="112" height="30" rx="10" className="fill-gold/8" />
  </svg>
);

const AppInstall: React.FC = () => {
  /** Android Chrome 支援時的一鍵安裝 */
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvt(null);
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title="把網站變成 APP ｜ 阿倫教官 Coach Aaron"
        description="30 秒把阿倫教官加入手機主畫面，像 APP 一樣使用：iOS Safari 與 Android Chrome 圖解教學，不用 App Store、不佔空間。"
        url="/app"
        breadcrumbs={[{ name: "變成 APP", url: "/app" }]}
      />

      <div className="relative z-10 pt-20 sm:pt-24 pb-16 sm:pb-24 px-4">
        <div className="studio-container max-w-3xl mx-auto">
          <PageHeader
            label="Install as APP"
            title="把網站變成 APP"
            subtitle="30 秒加入主畫面，不用 App Store、不佔空間"
          />

          {/* 完成後長這樣 + 一鍵安裝 */}
          <div
            className="text-center mb-10 sm:mb-14 -mt-2"
            data-aos="fade-up"
          >
            <PhoneIllustration />
            <p className="text-sm text-muted mt-3">
              完成後，主畫面就會出現「阿倫教官」，點開就是全螢幕 APP 體驗。
            </p>

            {installed ? (
              <p className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg bg-gold/15 border border-gold/40 text-gold text-sm">
                <span className="[&_svg]:w-4 [&_svg]:h-4">{CheckIcon}</span>
                已安裝完成，去主畫面找「阿倫教官」吧！
              </p>
            ) : installEvt ? (
              <button
                onClick={handleInstall}
                className="mt-5 px-8 py-3 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 text-sm tracking-widest transition-all hover:shadow-lg hover:shadow-gold/10"
              >
                ⚡ 一鍵安裝到主畫面
              </button>
            ) : null}
          </div>

          {/* 兩平台步驟卡 */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* iOS */}
            <section
              className="rounded-2xl border border-gold/15 bg-surface p-6"
              data-aos="fade-up"
            >
              <h2 className="flex items-center gap-2.5 text-lg font-medium mb-5">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-gold" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.79.05 2.28-.78 3.85-.67 1.31.11 2.3.62 2.95 1.57-2.71 1.63-2.28 5.26.44 6.35-.5 1.5-1.15 2.99-2.32 4.92zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                iPhone / iPad（Safari）
              </h2>
              <ol className="space-y-5">
                <Step no={1} icon={GlobeIcon} title="用 Safari 開啟本站"
                  desc="iOS 只有 Safari 能加入主畫面，其他瀏覽器要先切回 Safari。" />
                <Step no={2} icon={ShareIcon} title="點底部「分享」按鈕"
                  desc={<>網址列旁邊那顆「方框 + 向上箭頭」的圖示。</>} />
                <Step no={3} icon={AddSquareIcon} title="選「加入主畫面」"
                  desc="在分享選單往下滑一點就會看到。" />
                <Step no={4} icon={CheckIcon} title="點右上角「加入」"
                  desc="完成！主畫面會出現阿倫教官的 icon。" />
              </ol>
            </section>

            {/* Android */}
            <section
              className="rounded-2xl border border-gold/15 bg-surface p-6"
              data-aos="fade-up"
              data-aos-delay="80"
            >
              <h2 className="flex items-center gap-2.5 text-lg font-medium mb-5">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-gold" fill="currentColor" aria-hidden="true">
                  <path d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.86 3.22a11.6 11.6 0 00-9.84 0L5.22 5.92a.38.38 0 00-.66.38L6.4 9.48A10.86 10.86 0 001 18h22a10.86 10.86 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                </svg>
                Android（Chrome）
              </h2>
              <ol className="space-y-5">
                <Step no={1} icon={GlobeIcon} title="用 Chrome 開啟本站"
                  desc="Samsung Internet、Edge 等主流瀏覽器也支援，步驟大同小異。" />
                <Step no={2} icon={KebabIcon} title="點右上角「⋮」選單"
                  desc="或直接點畫面下方跳出的「安裝」提示條，一步到位。" />
                <Step no={3} icon={AddSquareIcon} title="選「安裝應用程式」"
                  desc="舊版 Chrome 叫「加入主畫面」，是同一件事。" />
                <Step no={4} icon={CheckIcon} title="確認安裝"
                  desc="完成！APP 會出現在主畫面與應用程式列表。" />
              </ol>
            </section>
          </div>

          {/* 小字說明 */}
          <p className="text-center text-xs text-muted/70 mt-8 leading-relaxed" data-aos="fade-up">
            這是 PWA（漸進式網頁應用）技術：不經過 App Store、幾乎不佔手機空間，
            內容永遠和網站同步更新。移除方式與一般 APP 相同（長按 icon → 移除）。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppInstall;
