/**
 * NOWPayments API helper.
 * Handles crypto payment creation and webhook verification.
 * Uses lazy initialization so env vars are read at runtime, not import time.
 */

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

function getApiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new Error("NOWPAYMENTS_API_KEY not set");
  return key;
}

function getIpnsSecret(): string {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) throw new Error("NOWPAYMENTS_IPN_SECRET not set");
  return secret;
}

function getAppUrl(): string {
  return process.env.APP_URL || "https://novacv-production.up.railway.app";
}

export interface CreatePaymentParams {
  priceAmount: number;      // USD amount
  priceCurrency: string;    // "usd"
  payCurrency: string;      // "btc", "eth", "usdc", "usdt"
  orderId: string;          // Your internal order ID
  orderDescription: string; // e.g. "NovaCV Pro Monthly"
}

export interface PaymentResult {
  paymentId: string;
  paymentStatus: string;
  payAddress: string;       // Wallet address to send crypto to
  payAmount: number;        // Amount of crypto to send
  payCurrency: string;      // Which crypto
  priceAmount: number;      // Original USD amount
  expirationFromDate: number;
  expirationToDate: number;
  invoiceUrl?: string;      // NOWPayments hosted checkout URL
}

/**
 * Create a crypto payment via NOWPayments.
 * Returns payment details including the address to pay and the checkout URL.
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const res = await fetch(`${NOWPAYMENTS_API}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      pay_currency: params.payCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: `${getAppUrl()}/api/webhooks/crypto`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NOWPayments error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    paymentId: data.payment_id,
    paymentStatus: data.payment_status,
    payAddress: data.pay_address,
    payAmount: data.pay_amount,
    payCurrency: data.pay_currency,
    priceAmount: data.price_amount,
    expirationFromDate: data.expirationFromDate,
    expirationToDate: data.expirationToDate,
    invoiceUrl: data.invoice_url,
  };
}

/**
 * Verify a NOWPayments IPN (webhook) signature.
 * NOWPayments signs the payload with HMAC-SHA512 using the IPN secret.
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    // In Node.js, we can use the crypto module
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha512", getIpnsSecret())
      .update(body)
      .digest("hex");
    return signature === expected;
  } catch {
    return false;
  }
}

/**
 * Get available payment currencies from NOWPayments.
 */
export async function getAvailableCurrencies(): Promise<string[]> {
  const res = await fetch(`${NOWPAYMENTS_API}/currencies`, {
    headers: { "x-api-key": getApiKey() },
  });
  const data = await res.json();
  return data.currencies || [];
}

/**
 * Check if a currency is one of our supported ones.
 */
export function isSupportedCrypto(currency: string): boolean {
  return ["btc", "eth", "usdc", "usdt"].includes(currency.toLowerCase());
}
