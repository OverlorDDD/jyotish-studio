# Galaxiora A7 payment options before business registration — decision memo (2026-10-20)

**Not a checkout implementation. No bank accounts, crypto receiving address, card data, webhook, prices or tax-free status are presumed.**

## Fact pattern

The project owner is an individual resident in Ukraine who cannot currently register as a sole proprietor (ФОП) or legal entity; has a personal PrivatBank card and a Binance account; wants monetization of human Tarot/Jyotish readings and future Premium features. The current `ReadingOrder` is strictly unpaid precheckout and must remain so.

## Key tax and registration distinction

- **Unconditional voluntary support:** a visitor may voluntarily support a free site without buying, unlocking or reserving anything. No fixed amount, minimum, paid status, access gate or promised individual reading. The PrivatBank *Конверт* product supports link-based collections on an individual account. This does **not** automatically grant charitable-organization status or tax exemption; the actual nature of the income and any applicable exemptions need assessment.
- **Compensated personalized reading:** if money is required or expected in return for providing a reading, it is **service revenue**, even if the button is called a “donation”, “gift” or “thank you”. Ukrainian tax authorities explain that a physical person receiving payments for services from other physical persons generally declares such income and pays 18% personal income tax and 5% military levy under cited contemporary guidance. See https://kyiv.tax.gov.ua/media-ark/news-ark/print-945483.html and https://rv.tax.gov.ua/deklaratsiyna-kampaniya-2026/informatsiyni-povidomlennya/print-995815.html
- **Systematic activity:** regularly selling professional services can require registration as a business and expose a nonregistered seller to administrative sanctions, independent of whether the income is declared. Do not promise that annual declaration alone legalizes a repeated checkout. See https://kyivobl.tax.gov.ua/media-ark/news-ark/print-992171.html and https://lg.tax.gov.ua/media-ark/news-ark/999435.html
- **Personal card/Конверт:** payment channel, not a business identity or automatic tax classification. See https://www.privatbank.com.ua/envelopes-p24 and https://conditions-and-rules.privatbank.ua/main/view-content-510/?lang=uk
- **Binance / USDT:** transferring value as crypto does not change the legal nature of the paid reading or remove reporting requirements. Binance Pay Merchant has eligibility/KYC/commercial terms, and the future Ukrainian virtual-assets framework is not a blanket exemption. No automated personal wallet checkout before legal and identity review. See https://www.binance.com/en/support/faq/detail/7a49148912214defa816f14ee51b9f9f and https://zakon.rada.gov.ua/laws/show/2074-20

## Recommended feasible stages

**Now (without registration):**
1. All Tarot and Jyotish automated readings free within quotas; public demonstrations, QA and content SEO.
2. A separate `Support Galaxiora` page, only after the owner supplies an actual Konvert share link and confirms the bank terms. Honest wording: contributions are unconditional, no special access or personalized service provided. Avoid calling it a certified charity. Keep a private ledger of transfers and expenses; obtain tax assessment for any personal receipts. No automatic entitlement or order state.
3. Human consultation requests are private **unpaid drafts**; no delivery promise, no paid/unpaid manual self-confirmation, and no prompt exposing bank card numbers or wallet seeds.

**If occasional paid consultation is needed:** obtain an individual Ukrainian tax consultation and bank confirmation of whether a limited non-systematic service can lawfully be paid to this person and declared; document each actual agreement/payment and any refunds. Do not present this as scalable commerce.

**For a scalable service while the owner cannot register:** consider an independent, genuinely operating and verified registered partner / agency / marketplace as **merchant of record**, contracting with customers, accepting money, issuing required receipts, bearing refunds, chargebacks and tax duties, and legally compensating the author/expert for work under an appropriate agreement. The partner must actually control commerce; fictitious nominee companies are not an option. Confirm withholding, commission and customer-data requirements before integration. If there is no suitable legal partner, keep selling disabled and grow the free audience instead.

**Later:** when lawful registration becomes available, select acquiring gateway and merchant verification, publish fixed prices, cancellation/refund policies, contract and privacy notice, integrate hosted checkout with signed and idempotent webhooks. Only confirmed payment events advance `PENDING -> PAID`; use server-side amount/currency validation, provider event dedupe and independent admin audit. Never accept screenshots, a payment-form redirect, an arbitrary transfer reference or user-provided `paid=true` as proof.

## Product invariant

`POST /api/v1/reports` and Tarot's free flows cannot be linked to a donation amount. Expert queues and paid video delivery stay disabled. No payment information, personal crypto wallets, beneficiary secrets or card PAN/CVV should be stored in repo or database. Have an accountant/lawyer review the local factual arrangements before soliciting remuneration at scale.
