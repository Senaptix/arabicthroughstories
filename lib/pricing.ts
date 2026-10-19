// These must match the prices in Paddle exactly. Paddle charges the real amount;
// this file is only what we display.

export const PRICING = {
  single: {
    annual: 10,
    monthly: 1,
  },
  bundle: {
    annual: 17,
    monthly: 1.75,
  },
} as const;

export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? `£${amount}` : `£${amount.toFixed(2)}`;
}

export const SINGLE_MONTHLY_PRICE = formatPrice(PRICING.single.monthly);
export const SINGLE_ANNUAL_PRICE = formatPrice(PRICING.single.annual);
export const BUNDLE_MONTHLY_PRICE = formatPrice(PRICING.bundle.monthly);
export const BUNDLE_ANNUAL_PRICE = formatPrice(PRICING.bundle.annual);

export const SINGLE_BOOK_PRICE_LINE = `Read online from ${SINGLE_MONTHLY_PRICE} a month or ${SINGLE_ANNUAL_PRICE} for 12 months`;
export const BUNDLE_PRICE_LINE = `Both parts ${BUNDLE_ANNUAL_PRICE} for 12 months or ${BUNDLE_MONTHLY_PRICE} a month`;
export const PRICING_LINE = `${SINGLE_BOOK_PRICE_LINE} · ${BUNDLE_PRICE_LINE}`;
