/**
 * Checkout 頁面 - 結帳流程
 * @module pages/Checkout
 * @description 支援多種支付方式的結帳頁面
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { AllTranslations } from "@/context/LanguageContext";
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

/** 可用的支付方式（名稱／說明走翻譯字典） */
const buildPaymentOptions = (t: AllTranslations): PaymentOption[] => [
  {
    id: "linepay",
    name: "LINE Pay",
    icon: "💚",
    description: t.checkoutPage.payLinePayDesc,
    available: true,
  },
  {
    id: "newebpay",
    name: t.checkoutPage.payNewebPayName,
    icon: "💳",
    description: t.checkoutPage.payNewebPayDesc,
    available: true,
  },
  {
    id: "ecpay",
    name: t.checkoutPage.payEcPayName,
    icon: "🌿",
    description: t.checkoutPage.payEcPayDesc,
    available: true,
  },
  {
    id: "jkopay",
    name: t.checkoutPage.payJkoPayName,
    icon: "🟠",
    description: t.checkoutPage.payJkoPayDesc,
    available: true,
  },
  {
    id: "apple_pay",
    name: "Apple Pay",
    icon: "🍎",
    description: t.checkoutPage.payApplePayDesc,
    available: true,
  },
  {
    id: "google_pay",
    name: "Google Pay",
    icon: "🔵",
    description: t.checkoutPage.payGooglePayDesc,
    available: true,
  },
];

/** 陪跑方案資料（標題／時長／說明走翻譯字典） */
const buildCoachingPlans = (
  t: AllTranslations,
): Record<string, CoachingPlan> => ({
  "3-months": {
    id: "3-months",
    title: t.checkoutPage.plan3mTitle,
    duration: t.checkoutPage.plan3mDuration,
    price: 32800,
    sessions: 12,
    description: t.checkoutPage.plan3mDesc,
  },
  "6-months": {
    id: "6-months",
    title: t.checkoutPage.plan6mTitle,
    duration: t.checkoutPage.plan6mDuration,
    price: 59800,
    sessions: 24,
    description: t.checkoutPage.plan6mDesc,
  },
  "1-year": {
    id: "1-year",
    title: t.checkoutPage.plan1yTitle,
    duration: t.checkoutPage.plan1yDuration,
    price: 118000,
    sessions: 48,
    description: t.checkoutPage.plan1yDesc,
  },
});

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
  const { t } = useLanguage();

  const PAYMENT_OPTIONS = useMemo(() => buildPaymentOptions(t), [t]);
  const COACHING_PLANS = useMemo(() => buildCoachingPlans(t), [t]);

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
      setError(t.checkoutPage.selectPaymentError);
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
            title: t.checkoutPage.redirectTitle,
            message: t.checkoutPage.redirectMessage.replace(
              "{provider}",
              "LINE Pay",
            ),
          });
          break;
        case "newebpay":
          // 導向藍新金流
          await dialog.alert({
            title: t.checkoutPage.redirectTitle,
            message: t.checkoutPage.redirectMessage.replace(
              "{provider}",
              t.checkoutPage.payNewebPayName,
            ),
          });
          break;
        case "ecpay":
          // 導向綠界
          await dialog.alert({
            title: t.checkoutPage.redirectTitle,
            message: t.checkoutPage.redirectMessage.replace(
              "{provider}",
              t.checkoutPage.payEcPayName,
            ),
          });
          break;
        case "jkopay":
          // 導向街口支付
          await dialog.alert({
            title: t.checkoutPage.redirectTitle,
            message: t.checkoutPage.redirectMessage.replace(
              "{provider}",
              t.checkoutPage.payJkoPayName,
            ),
          });
          break;
        case "apple_pay":
        case "google_pay":
          // Apple Pay / Google Pay 直接在頁面處理
          await dialog.alert({
            title: t.checkoutPage.mobilePayTitle,
            message: t.checkoutPage.mobilePayMessage.replace(
              "{provider}",
              selectedPayment === "apple_pay" ? "Apple Pay" : "Google Pay",
            ),
          });
          break;
      }

      // 模擬成功後導向感謝頁
      navigate("/checkout/success?order=ORD" + Date.now());
    } catch (err) {
      console.error("結帳失敗:", err);
      setError(t.checkoutPage.checkoutFailed);
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
        <Loading theme="studio" text={t.common.loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-20 pb-12 px-4 relative">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title={t.checkoutPage.seoTitle.replace("{plan}", selectedPlan.title)}
        description={t.checkoutPage.seoDescription}
        url="/checkout"
      />

      <div className="studio-container relative z-10">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-light text-white/90 mb-2">
            {t.checkoutPage.heading}
          </h1>
          <p className="text-[#888]">{t.checkoutPage.subtitle}</p>
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
                <span className="text-white/90 text-sm">{t.checkoutPage.step1}</span>
              </div>
              <div className="w-12 h-px bg-[#c5a059]/50" />
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#c5a059] text-[#0a0a0a] flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span className="text-white/90 text-sm">{t.checkoutPage.step2}</span>
              </div>
              <div className="w-12 h-px bg-luxe-muted/30" />
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-luxe-muted/30 text-[#888] flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span className="text-[#888] text-sm">{t.checkoutPage.step3}</span>
              </div>
            </div>

            {/* 支付方式列表 */}
            <div className="bg-[#0a0a0a]/50 border border-[#c5a059]/20 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white/90 mb-4">
                {t.checkoutPage.choosePayment}
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
                        {t.checkoutPage.comingSoon}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 備註 */}
            <div className="bg-[#0a0a0a]/50 border border-[#c5a059]/20 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white/90 mb-4">
                {t.checkoutPage.orderNoteLabel}
              </h2>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={t.checkoutPage.orderNotePlaceholder}
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
                {t.checkout.orderSummary}
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
                  <span>
                    {t.checkoutPage.planDuration.replace(
                      "{duration}",
                      selectedPlan.duration,
                    )}
                  </span>
                </div>
              </div>

              {/* 價格明細 */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[#888]">
                  <span>{t.checkoutPage.planFee}</span>
                  <span>NT$ {selectedPlan.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>{t.checkoutPage.bonusCourses}</span>
                  <span className="text-green-400">
                    {t.checkoutPage.includedInPlan}
                  </span>
                </div>
              </div>

              {/* 總計 */}
              <div className="border-t border-[#c5a059]/10 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-white/90 font-medium">
                    {t.checkoutPage.amountDue}
                  </span>
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
                      {t.checkoutPage.processing}
                    </span>
                  ) : (
                    t.checkoutPage.confirmPayment
                  )}
                </GlowButton>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-[#888] text-sm">
                    {t.checkoutPage.loginToPurchase}
                  </p>
                  <GlowButton onClick={handleGoToLogin} className="w-full">
                    {t.nav.login}
                  </GlowButton>
                  <PillButton
                    theme="studio"
                    variant="default"
                    onClick={handleGoToRegister}
                    className="w-full"
                  >
                    {t.checkoutPage.registerNewAccount}
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
                <span>{t.checkoutPage.sslNotice}</span>
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
            {t.checkoutPage.backToCourses}
          </Link>
        </div>
      </div>

      {/* 登入提示 Modal */}
      <Modal
        isOpen={showLoginModal && !isAuthenticated}
        onClose={() => setShowLoginModal(false)}
        title={t.checkoutPage.loginRequiredTitle}
      >
        <div className="text-center py-4">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-white/90 mb-2">
            {t.checkoutPage.loginModalHeading}
          </h3>
          <p className="text-[#888] text-sm mb-6">
            {t.checkoutPage.loginModalBody}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GlowButton onClick={handleGoToLogin}>
              {t.checkoutPage.loginNow}
            </GlowButton>
            <PillButton
              theme="studio"
              variant="default"
              onClick={handleGoToRegister}
            >
              {t.checkoutPage.registerNewAccount}
            </PillButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Checkout;
