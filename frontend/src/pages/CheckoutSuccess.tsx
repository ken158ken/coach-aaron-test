/**
 * CheckoutSuccess 頁面 - 結帳成功
 * @module pages/CheckoutSuccess
 * @description 付款成功後的感謝頁面
 * @theme luxe (LUXE 高端主題)
 */

import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GlowButton, PillButton } from "@/components/ui";
import { SEOHead } from "@/components/seo";
/**
 * CheckoutSuccess - 結帳成功頁面
 *
 * @returns {JSX.Element} 結帳成功頁面
 */
const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderNumber = searchParams.get("order") || "ORD" + Date.now();

  return (
    <div className="min-h-screen bg-transparent pt-20 pb-12 px-4 flex items-center justify-center relative">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="付款成功"
        description="感謝您的購買"
        url="/checkout/success"
      />

      <div className="max-w-lg mx-auto text-center relative z-10">
        {/* 成功圖示 */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* 標題 */}
        <h1 className="text-2xl sm:text-3xl font-light text-white/90 mb-2">
          付款成功！
        </h1>
        <p className="text-[#888] mb-6">感謝您的購買，我們已收到您的訂單</p>

        {/* 訂單資訊 */}
        <div className="bg-[#0a0a0a]/50 border border-[#c5a059]/20 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center py-2 border-b border-[#c5a059]/10">
            <span className="text-[#888]">訂單編號</span>
            <span className="text-white/90 font-mono">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#c5a059]/10">
            <span className="text-[#888]">訂單狀態</span>
            <span className="text-green-400">已付款</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[#888]">訂單時間</span>
            <span className="text-white/90">
              {new Date().toLocaleString("zh-TW")}
            </span>
          </div>
        </div>

        {/* 下一步說明 */}
        <div className="bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-[#c5a059] font-medium mb-3">
            接下來會發生什麼？
          </h2>
          <ol className="space-y-2 text-white/90/80 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#c5a059]">1.</span>
              <span>我們會在 24 小時內與您聯繫，確認培訓時間</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c5a059]">2.</span>
              <span>您將收到一封確認信件，包含培訓相關資訊</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c5a059]">3.</span>
              <span>您可以在會員中心查看課程進度與培訓記錄</span>
            </li>
          </ol>
        </div>

        {/* 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <GlowButton onClick={() => navigate("/member")}>
            前往會員中心
          </GlowButton>
          <PillButton
            theme="studio"
            variant="default"
            onClick={() => navigate("/")}
          >
            返回首頁
          </PillButton>
        </div>

        {/* 聯絡資訊 */}
        <p className="mt-8 text-[#888] text-sm">
          如有任何問題，請
          <Link to="/contact" className="text-[#c5a059] hover:underline">
            聯絡我們
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
