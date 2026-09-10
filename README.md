# iStonk web

Wallet connect + fees dashboard for the iStonk iMessage bot.

- `/wallet/connect?s=` — CDP email OTP, smart account, 90-day delegation
- `/` — launches and claimable Stonks creator fees

Point `AGENT_API_HOST` at the iStonk service. Set iStonk `PAY_PAGE_ORIGIN` and `CORS_ALLOWED_ORIGINS` to this app's origin.

## Railway + Coinbase CDP

Send-code **Network Error** means the page origin is not on the CDP allowlist. Coinbase blocks the browser request before an OTP is sent.

1. Open [CDP Embedded Wallet domains](https://portal.cdp.coinbase.com/wallets/non-custodial/clients).
2. Add domain: `https://istonk-web-production.up.railway.app` (no trailing slash).
3. Save. It applies immediately — no redeploy.

Also set on this Railway service (rebuild after changing `NEXT_PUBLIC_*`):

- `NEXT_PUBLIC_CDP_PROJECT_ID` — `eaa74d0f-2a2d-470b-8a13-51aba1bf5e7b` (EVM Smart Accounts)
- `NEXT_PUBLIC_SITE_URL=https://istonk-web-production.up.railway.app`
- `AGENT_API_HOST` — public URL of the iStonk API service

On the iStonk API service:

- `PAY_PAGE_ORIGIN=https://istonk-web-production.up.railway.app`
- `CORS_ALLOWED_ORIGINS` includes that same origin

```bash
cp .env.example .env.local
npm install
npm run dev
```
