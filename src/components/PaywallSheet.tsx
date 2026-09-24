'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { loadRazorpayScript } from '@/utils/razorpay';
import { X, Sparkles, Check, Crown, Flame, ArrowRight, Percent } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaywallSheet: React.FC = () => {
  const {
    isPaywallOpen,
    closePaywall,
    student,
    openGate,
    setPlan,
    refreshPlan,
    showToast,
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  if (!isPaywallOpen) return null;

  const handleClose = () => {
    setIsWaitlistMode(false);
    closePaywall();
  };

  const basePriceRupees = 799;
  const discountedPriceRupees = appliedCoupon
    ? Math.round(basePriceRupees * (1 - appliedCoupon.discountPercent / 100))
    : basePriceRupees;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch(`/api/coupon?code=${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();

      if (data.ok && data.valid && data.discountPercent) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountPercent: data.discountPercent,
        });
        setCouponError(null);
        showToast(texts.paywall.appliedDiscount);
      } else {
        setAppliedCoupon(null);
        setCouponError(texts.paywall.invalidCoupon);
      }
    } catch (e) {
      setCouponError(texts.paywall.invalidCoupon);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!student) {
      handleClose();
      openGate();
      return;
    }

    setIsJoiningWaitlist(true);
    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'waitlist',
          name: student.name,
          phone: student.phone,
          plan: 'Pro',
        }),
      });
      showToast(texts.pricing.waitlistSuccess);
      handleClose();
    } catch (e) {
      showToast(texts.pricing.waitlistSuccess);
      handleClose();
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const handleCheckout = async () => {
    if (!student) {
      handleClose();
      openGate(() => {
        setTimeout(() => closePaywall(), 50);
      });
      return;
    }

    setIsProcessingOrder(true);

    try {
      const orderRes = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'pro',
          coupon: appliedCoupon ? appliedCoupon.code : couponCode.trim() || undefined,
          phone: student.phone,
        }),
      });

      if (orderRes.status === 503) {
        setIsWaitlistMode(true);
        setIsProcessingOrder(false);
        return;
      }

      const orderData = await orderRes.json();
      if (!orderData.ok || !orderData.orderId) {
        if (orderData.error === 'payments-not-live') {
          setIsWaitlistMode(true);
          setIsProcessingOrder(false);
          return;
        }
        showToast('could not create order, retry ⚡');
        setIsProcessingOrder(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (orderData.isSimulated || !scriptLoaded || !(window as any).Razorpay) {
        const testPaymentId = `pay_test_${Date.now()}`;
        const verifyRes = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: testPaymentId,
            signature: 'simulated_test_sig',
            plan: 'pro',
            coupon: appliedCoupon ? appliedCoupon.code : couponCode.trim() || '',
            phone: student.phone,
            amount: orderData.amount / 100,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.ok && verifyData.verified) {
          setPlan('pro');
          await refreshPlan();
          try {
            confetti({
              particleCount: 90,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#7C3AED', '#A3E635', '#F472B6'],
            });
          } catch (e) {}
          showToast(texts.pricing.unlockedToast);
          closePaywall();
        } else {
          showToast(texts.pricing.cancelToast);
        }
        setIsProcessingOrder(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Centum',
        description: 'Centum Pro Annual Pass',
        order_id: orderData.orderId,
        prefill: {
          name: student.name,
          contact: student.phone,
        },
        theme: {
          color: '#7C3AED',
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                plan: 'pro',
                coupon: appliedCoupon ? appliedCoupon.code : couponCode.trim() || '',
                phone: student.phone,
                amount: orderData.amount / 100,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.ok && verifyData.verified) {
              setPlan('pro');
              await refreshPlan();
              try {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#7C3AED', '#A3E635', '#F472B6'],
                });
              } catch (e) {}
              showToast(texts.pricing.unlockedToast);
              closePaywall();
            } else {
              showToast(texts.pricing.cancelToast);
            }
          } catch (err) {
            showToast(texts.pricing.cancelToast);
          }
        },
        modal: {
          ondismiss: function () {
            showToast(texts.pricing.cancelToast);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function () {
        showToast(texts.pricing.cancelToast);
      });
      razorpayInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(texts.pricing.cancelToast);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Centum Pro Paywall"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#3B0F6E] rounded-t-3xl p-6 shadow-2xl border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20 animate-slide-up flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-[#2E1065] dark:text-[#FAF5FF] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle & Close Button */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
            <Crown className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A3E635]">
              {isWaitlistMode ? 'Waitlist 🎟️' : texts.paywall.proBadge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#FAF5FF] dark:bg-[#230542] text-[#6D28D9] dark:text-[#A3E635] flex items-center justify-center hover:bg-[#EDE9FE] dark:hover:bg-[#4C1D95] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isWaitlistMode ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center justify-center text-3xl shadow-xs">
              🐣
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
                payments launch soon 🐣
              </h2>
              <p className="text-sm font-black text-[#7C3AED] dark:text-[#A3E635]">
                get on the Pro list
              </p>
            </div>

            <button
              type="button"
              onClick={handleJoinWaitlist}
              disabled={isJoiningWaitlist}
              className="w-full min-h-[50px] flex items-center justify-center gap-2 font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer disabled:opacity-60 mt-2"
            >
              {isJoiningWaitlist ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#18181B] border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>get on the Pro list 🐣</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <h2 className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
                {texts.paywall.title}
              </h2>
              <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] mt-0.5">
                {texts.pricing.subtitle}
              </p>
            </div>

            {/* 3 Punchy Lines */}
            <div className="space-y-2.5 bg-[#FAF5FF] dark:bg-[#230542] p-4 rounded-2xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
              <div className="flex items-start gap-2.5 text-xs font-extrabold text-[#2E1065] dark:text-[#FAF5FF]">
                <span className="p-1 rounded-lg bg-white dark:bg-[#3B0F6E] shadow-xs text-[#7C3AED] dark:text-[#A3E635] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>{texts.paywall.pitch1}</span>
              </div>

              <div className="flex items-start gap-2.5 text-xs font-extrabold text-[#2E1065] dark:text-[#FAF5FF]">
                <span className="p-1 rounded-lg bg-white dark:bg-[#3B0F6E] shadow-xs text-[#7C3AED] dark:text-[#A3E635] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>{texts.paywall.pitch2}</span>
              </div>

              <div className="flex items-start gap-2.5 text-xs font-extrabold text-[#2E1065] dark:text-[#FAF5FF]">
                <span className="p-1 rounded-lg bg-white dark:bg-[#3B0F6E] shadow-xs text-[#7C3AED] dark:text-[#A3E635] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>{texts.paywall.pitch3}</span>
              </div>
            </div>

            {/* Price Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-[#7C3AED]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#E9D5FF] uppercase tracking-wider block">
                  Annual Pass
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tight">
                    ₹{discountedPriceRupees}/yr
                  </span>
                  {appliedCoupon && (
                    <span className="text-xs line-through text-[#E9D5FF]/70">
                      ₹{basePriceRupees}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-extrabold text-[#A3E635]">
                  {texts.paywall.priceDisplay}
                </span>
              </div>

              {appliedCoupon ? (
                <span className="px-2.5 py-1 rounded-full bg-[#A3E635] text-[#18181B] text-[10px] font-black uppercase shadow-xs">
                  {appliedCoupon.discountPercent}% OFF
                </span>
              ) : (
                <span className="text-2xl">👑</span>
              )}
            </div>

            {/* Coupon Field */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={texts.paywall.couponPlaceholder}
                  className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 focus:border-[#7C3AED] outline-none text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF] placeholder:text-[#6D28D9]/40 dark:placeholder:text-[#DDD6FE]/40 uppercase bg-[#FAF5FF] dark:bg-[#230542]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="min-h-[44px] px-4 rounded-xl bg-white dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] text-xs font-black text-[#7C3AED] dark:text-[#A3E635] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isApplyingCoupon ? '...' : texts.paywall.applyCoupon}
                </button>
              </div>

              {couponError && (
                <p className="text-[11px] font-bold text-[#E11D48] mt-1 ml-1">
                  {couponError}
                </p>
              )}

              {appliedCoupon && (
                <p className="text-[11px] font-bold text-[#16A34A] dark:text-[#4ADE80] mt-1 ml-1 flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Code {appliedCoupon.code} applied ({appliedCoupon.discountPercent}% off)!
                </p>
              )}
            </div>

            {/* Go Pro CTA */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isProcessingOrder}
              className="w-full min-h-[50px] flex items-center justify-center gap-2 font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {isProcessingOrder ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#18181B] border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{texts.pricing.goPro}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
