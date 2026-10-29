/**
 * Centralized Single Source of Truth for Centum Pro Pricing & Coupons
 * Reconciles pricing logic across:
 * - /pricing
 * - /pro
 * - ProUpsellModal
 * - PaywallSheet
 * - /api/order
 * - /api/verify
 */

// Reference struck price (crossed out reference value)
export const PRO_PRICE_STRUCK = 2500;

// Canonical Standard Price for Centum Pro full annual pass
export const PRO_PRICE = 1499;

// Special coupon/referral price
export const PRO_PRICE_COUPON = 999;

// Historical legacy base price (noted for reconciliation audit)
export const PRO_PRICE_LEGACY_BASE = 799;

export interface CouponDiscount {
  valid: boolean;
  discountPercent?: number;
  code?: string;
}

/**
 * Computes the final payable price given a base price and an optional coupon.
 * If a valid coupon is applied and provides a percentage discount, calculates
 * the rounded discounted price; if discount is not specified but coupon is valid,
 * defaults to the standard coupon target (PRO_PRICE_COUPON).
 */
export function calculatePayablePrice(
  basePrice: number = PRO_PRICE,
  coupon?: CouponDiscount | null
): number {
  if (!coupon || !coupon.valid) {
    return basePrice;
  }
  if (coupon.discountPercent && coupon.discountPercent > 0) {
    return Math.round(basePrice * (1 - coupon.discountPercent / 100));
  }
  return PRO_PRICE_COUPON;
}

/**
 * Returns formatted pricing labels and period copy for Tamil and English locales.
 */
export function getPricingPeriodCopy(isTamil: boolean): string {
  return isTamil ? '/ முழு ஆண்டு' : '/ year';
}
