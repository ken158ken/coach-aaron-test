/**
 * Checkout 頁面 - 結帳流程
 * @module pages/Checkout
 * @description 支援多種支付方式的結帳頁面
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { GlowButton, PillButton, Loading, Modal } from "@/components/ui";
import { useDialog } from "@/components/ui/Dialog";
import { SEOHead } from "@/components/seo";
/** 支付方式類型 */
type PaymentMethod =
  | "linepay"
  | "newebpay"
  | "ecpay"
  | "jkopay"
  | "apple_pay"
  | "google_pay";

/** 支付方式資訊 */
interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

/** 陪跑方案資料 */
interface CoachingPlan {
  id: string;
  title: string;
  duration: string;
  price: number;
  sessions: number;
  description: string;
}

/** 可用的支付方式 */
const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "linepay",
    name: "LINE Pay",
    icon: "💚",
    description: "使用 LINE Pay 快速付款",
    available: true,
  },
  {
    id: "newebpay",
    name: "藍新金流",
    icon: "💳",
    description: "信用卡、ATM 轉帳、超商代碼",
    available: true,
  },
  {
    id: "ecpay",
    name: "綠界科技",
    icon: "🌿",
    description: "信用卡、ATM、超商付款",
    available: true,
  },
  {
    id: "jkopay",
    name: "街口支付",
    icon: "🟠",
    description: "使用街口支付掃碼付款",
    available: true,
  },
  {
    id: "apple_pay",
    name: "Apple Pay",
    icon: "🍎",
    description: "使用 Apple Pay 快速結帳",
    available: true,
  },
  {
    id: "google_pay",
    name: "Google Pay",
    icon: "🔵",
    description: "使用 Google Pay 快速結帳",
    available: true,
  },
];

/** 陪跑方案資料 */
const COACHING_PLANS: Record<string, CoachingPlan> = {
  "3-months": {
    id: "3-months",
    title: "三個月陪跑方案",
    duration: "三個月",
    price: 32800,
    sessions: 12,
    description: "1對1培訓 12次",
  },
  "6-months": {
    id: "6-months",
    title: "六個月陪跑方案",
    duration: "六個月",
    price: 59800,
    sessions: 24,
    description: "1對1培訓 24次",
  },
  "1-year": {
    id: "1-year",
    title: "一年陪跑方案",
    duration: "一年",
    price: 118000,
    sessions: 48,
    description: "1對1培訓 48次",
  },
};

/**
 * Checkout - 結帳頁面
 *
 * @returns {JSX.Element} 結帳頁面
 */
const Checkout: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dialog = useDialog();

  // 狀態
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState("");

  // 訂單資訊
  const [orderNote, setOrderNote] = useState("");

  // 取得方案 ID
  const planId = searchParams.get("plan") || "6-months";
  const selectedPlan = COACHING_PLANS[planId] || COACHING_PLANS["6-months"];

  // 檢查登入狀態
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [authLoading, isAuthenticated]);

  /** 處理支付方式選擇 */
  const handlePaymentSelect = (paymentId: PaymentMethod) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setSelectedPayment(paymentId);
    setError("");
  };

  /** 處理結帳 */
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedPayment) {
      setError("請選擇支付方式");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // TODO: 實際串接金流 API
      // 模擬 API 呼叫
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 模擬建立訂單
      const orderData = {
        planId: selectedPlan.id,
        paymentMethod: selectedPayment,
        amount: selectedPlan.price,
        note: orderNote,
        userId: user?.user_id,
      };

      console.log("建立訂單:", orderData);

      // 根據支付方式導向不同頁面
      switch (selectedPayment) {
        case "linepay":
          // 導向 LINE Pay
          await dialog.alert({
            title: "付款導向",
            message: "將導向 LINE Pay 付款頁面（模擬）",
          });
          break;
        case "newebpay":
          // 導向藍新金流
          await dialog.alert({
            title: "付款導向",
            message: "將導向藍新金流付款頁面（模擬）",
          });
          break;
        case "ecpay":
          // 導向綠界
          await dialog.alert({
            title: "付款導向",
            message: "將導向綠界付款頁面（模擬）",
          });
          break;
        case "jkopay":
          // 導向街口支付
          await dialog.alert({
            title: "付款導向",
            message: "將導向街口支付頁面（模擬）",
          });
          break;
        case "apple_pay":
        case "google_pay":
          // Apple Pay / Google Pay 直接在頁面處理
          await dialog.alert({
            title: "行動支付",
            message: `將啟動 ${selectedPayment === "apple_pay" ? "Apple Pay" : "Google Pay"}（模擬）`,
          });
          break;
      }

      // 模擬成功後導向感謝頁
      navigate("/checkout/success?order=ORD" + Date.now());
    } catch (err) {
      console.error("結帳失敗:", err);
      setError("結帳失敗，請稍後再試");
    } finally {
      setIsProcessing(false);
    }
  };

  /** 導向登入頁 */
  const handleGoToLogin = () => {
    navigate(`/login?redirect=/checkout?plan=${planId}`);
  };

  /** 導向註冊頁 */
  const handleGoToRegister = () => {
    navigate(`/register?redirect=/checkout?plan=${planId}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loading theme="studio" text="載入中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-20 pb-12 px-4 relative">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title={`結帳 - ${selectedPlan.title}`}
        description="安全快速的結帳流程，支援多種支付方式"
        url="/checkout"
      />

      <div className="studio-container relative z-10">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-light text-white/90 mb-2">
            確認訂單
          </h1>
          <p className="text-[#888]">請確認您的訂單資訊並選擇支付方式</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* 左側：支付方式選擇 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 步驟指示器 */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#c5a059] text-[#0a0a0a] flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span className="text-white/90 text-sm">選擇方案</span>
              </div>
              <div className="w-12 h-px bg-[#c5a059]/50" />
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#c5a059] text-[#0a0a0a] flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span className="text-white/90 text-sm">選擇支付</span>
              </div>
              <div className="w-12 h-px bg-luxe-muted/30" />
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-luxe-muted/30 text-[#888] flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span className="text-[#888] text-sm">完成付款</span>
              </div>
            </div>

            {/* 支付方式列表 */}
            <div className="bg-[#0a0a0a]/50 border border-[#c5a059]/20 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white/90 mb-4">
                選擇支付方式
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handlePaymentSelect(option.id)}
                    disabled={!option.available || isProcessing}
                    className={`
                      relative p-4 rounded-xl border-2 text-left transition-all duration-200
                      ${
                        selectedPayment === option.id
                          ? "border-[#c5a059] bg-[#c5a059]/10"
                          : "border-[#c5a059]/20 hover:border-[#c5a059]/50"
                      }
                      ${!option.available ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    {selectedPayment === option.id && (
                      <div className="absolute top-2 right-2">
                        <svg
                          className="w-5 h-5 text-[#c5a059]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <p className="text-white/90 font-medium">
                          {option.name}
                        </p>
                        <p className="text-[#888] text-xs">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {!option.available && (
                      <span className="absolute top-2 right-2 text-xs text-[#888]">
                        即將推出
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 備註 */}
            <div className="bg-[#0a0a0a]/50 border border-[#c5a059]/20 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white/90 mb-4">
                訂單備註（選填）
              </h2>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="如有特殊需求請在此說明..."
                className="w-full h-24 px-4 py-3 bg-transparent border border-[#c5a059]/20 rounded-lg text-white/90 placeholder-[#888]/50 resize-none focus:outline-none focus:border-[#c5a059]/50"
              />
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* 右側：訂單摘要 */}
          <div className="lg:col-span-2">
            <div className="bg-[#0a0a0a]/50 border border-[#c5a059]/20 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-medium text-white/90 mb-4">
                訂單摘要
              </h2>

              {/* 方案資訊 */}
              <div className="border-b border-[#c5a059]/10 pb-4 mb-4">
                <h3 className="text-white/90 font-medium mb-1">
                  {selectedPlan.title}
                </h3>
                <p className="text-[#888] text-sm mb-2">
                  {selectedPlan.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-[#888]">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>方案時長：{selectedPlan.duration}</span>
                </div>
              </div>

              {/* 價格明細 */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[#888]">
                  <span>方案費用</span>
                  <span>NT$ {selectedPlan.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>附贈課程</span>
                  <span className="text-green-400">含在方案內</span>
                </div>
              </div>

              {/* 總計 */}
              <div className="border-t border-[#c5a059]/10 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-white/90 font-medium">應付金額</span>
                  <span className="text-2xl font-bold text-[#c5a059]">
                    NT$ {selectedPlan.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 結帳按鈕 */}
              {isAuthenticated ? (
                <GlowButton
                  onClick={handleCheckout}
                  disabled={!selectedPayment || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      處理中...
                    </span>
                  ) : (
                    "確認付款"
                  )}
                </GlowButton>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-[#888] text-sm">
                    請先登入以完成購買
                  </p>
                  <GlowButton onClick={handleGoToLogin} className="w-full">
                    登入
                  </GlowButton>
                  <PillButton
                    theme="studio"
                    variant="default"
                    onClick={handleGoToRegister}
                    className="w-full"
                  >
                    註冊新帳號
                  </PillButton>
                </div>
              )}

              {/* 安全提示 */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[#888] text-xs">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>SSL 加密安全交易</span>
              </div>
            </div>
          </div>
        </div>

        {/* 返回連結 */}
        <div className="mt-8 text-center">
          <Link
            to="/courses"
            className="text-[#c5a059] hover:underline text-sm"
          >
            ← 返回課程頁面
          </Link>
        </div>
      </div>

      {/* 登入提示 Modal */}
      <Modal
        isOpen={showLoginModal && !isAuthenticated}
        onClose={() => setShowLoginModal(false)}
        title="請先登入"
      >
        <div className="text-center py-4">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-white/90 mb-2">
            如要購買課程，請先註冊或登入
          </h3>
          <p className="text-[#888] text-sm mb-6">
            登入後即可選擇支付方式並完成購買
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GlowButton onClick={handleGoToLogin}>立即登入</GlowButton>
            <PillButton
              theme="studio"
              variant="default"
              onClick={handleGoToRegister}
            >
              註冊新帳號
            </PillButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Checkout;
