# iStonk web

Landing page + wallet dashboard for the iStonk iMessage bot.

- `/` — landing: what iStonk does, the launch wizard, the wallet, what's coming from Basemate (onramp, tokenized stocks, send-to-phone), CTAs to iMessage and socials. Framer Motion for scroll/pointer parallax. Copy + links live in `src/lib/site.ts`; socials come from `NEXT_PUBLIC_SOCIAL_X` / `NEXT_PUBLIC_SOCIAL_TELEGRAM`.
- `/app` — wallet balance, holdings, claimable Stonks creator fees, launches, and send-to-external-wallet (`POST /api/app/stonks/transfer` on the iStonk API)
- `/wallet/connect?s=` — CDP email OTP, smart account, 90-day delegation (redirects to `/app` when done)

Theme tokens (iridescent light palette) are in `src/app/globals.css`; `.glass`, `.iris-ring`, `.text-iris` and `.aurora-wash` are shared between the landing and the dashboard.

Point `AGENT_API_HOST` at the iStonk service. Set iStonk `PAY_PAGE_ORIGIN` and `CORS_ALLOWED_ORIGINS` to this app's origin.

## Railway + Coinbase CDP

Send-code **Network Error** means the page origin is not on the CDP allowlist. Coinbase blocks the browser request before an OTP is sent.

1. Open [CDP Embedded Wallet domains](https://portal.cdp.coinbase.com/wallets/non-custodial/clients).
2. Add domain: `https://istonk-web-production.up.railway.app` (no trailing slash).
3. Save. It applies immediately — no redeploy.

Also set on this Railway service (rebuild after changing `NEXT_PUBLIC_*`):

- `NEXT_PUBLIC_CDP_PROJECT_ID` — `eaa74d0f-2a2d-470b-8a13-51aba1bf5e7b` (EVM Smart Accounts)
- `NEXT_PUBLIC_SITE_URL=https://istonk-web-production.up.railway.app`
- `AGENT_API_HOST=https://api.istonks.meme` — public URL of the iStonk API (runtime, no rebuild). `localhost` here is why the connect page says “Couldn't reach wallet setup.”

On the iStonk API service:

- `PAY_PAGE_ORIGIN=https://istonk-web-production.up.railway.app`
- `CORS_ALLOWED_ORIGINS` includes that same origin

```bash
cp .env.example .env.local
npm install
npm run dev
```
