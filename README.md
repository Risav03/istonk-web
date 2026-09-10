# iStonk web

Wallet connect + fees dashboard for the iStonk iMessage bot.

- `/wallet/connect?s=` — CDP email OTP, smart account, 90-day delegation
- `/` — launches and claimable Stonks creator fees

Point `AGENT_API_HOST` at the iStonk service. Set iStonk `PAY_PAGE_ORIGIN` and `CORS_ALLOWED_ORIGINS` to this app's origin.

```bash
cp .env.example .env.local
npm install
npm run dev
```
