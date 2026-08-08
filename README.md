# METIQ — Crypto Meta Intelligence

METIQ is a lightweight, production-ready MVP designed to detect emerging cryptocurrency narratives (“metas”) from decentralized exchanges. The system is centered around a Telegram bot interface, supported by a public landing page and a real-time status monitor.

METIQ scans market data automatically every six hours and allows authorized users to request a fresh scan manually via Telegram command or callback query.

---

## Core Objectives & Free Stack

METIQ is designed to run entirely on free-tier services with zero operating costs:
* **Framework:** Next.js (App Router, strict TypeScript, Tailwind CSS).
* **Database:** Supabase Free Tier (PostgreSQL instance).
* **Market Data:** DexScreener Public REST API (no API key required).
* **Delivery:** Telegram Bot API (via serverless webhooks).
* **Hosting:** Vercel (Serverless functions).
* **No Paid APIs:** AI classification is replaced with a weighted keyword taxonomy; X API integration is mocked/disabled unless keys are provided.

---

## System Architecture

```text
               ┌──────────────────────────┐
               │    Vercel Serverless     │
               │   (Next.js App Router)   │
               └─────────────┬────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐      ┌───────────────┐
│ /api/health  │     │  /api/cron   │      │ /api/telegram │
│   [Health]   │     │    [Scan]    │      │   [Webhook]   │
└──────────────┘     └───────┬──────┘      └───────┬───────┘
                             │                     │
                             ▼                     │
                     ┌──────────────┐              │
                     │ Scan Runner  │◄─────────────┘
                     └───────┬──────┘
                             │
     ┌───────────────────────┼──────────────────────┐
     ▼                       ▼                      ▼
┌──────────────┐     ┌──────────────┐       ┌──────────────┐
│ DexScreener  │     │   Taxonomy   │       │   Supabase   │
│ Public Feed  │     │ Classifier   │       │  PostgreSQL  │
└──────────────┘     └──────────────┘       └──────────────┘
```

The system separates concerns cleanly:
1. **`lib/collectors/dexscreener.ts`**: Queries DexScreener public endpoints (latest boosts, top boosts, and latest profiles), deduplicates candidates, groups them by chain, batches queries, filters by minimum liquidity, and selects the most liquid pool.
2. **`lib/classification/taxonomy.ts`**: Implements taxonomy mapping with weighted keyword scores across names, symbols, and descriptions.
3. **`lib/scoring/engine.ts`**: Computes 0-100 narrative scores, stages (Weak, Forming, Emerging, Accelerating, Crowded, Cooling), and concentration penalties.
4. **`lib/scanning/runner.ts`**: Manages scanning triggers, enforces manual scanner cooldowns, checks database mutex locks, and coordinates persistence.
5. **`lib/telegram/bot.ts`**: Handles Telegram Bot API calls, message splitting, and HTML escaping.

---

## Dynamic Narrative Scoring Model

Narratives are scored out of **100 points** based on explainable market factors:
* **6H Market Volume (Max 25 pts):** Logarithmic scaling. $1K transacted = 0 pts; $100K = 12.5 pts; $10M = 25 pts.
* **Narrative Breadth (Max 20 pts):** Based on active token count. 1 token = 2 pts; 10+ tokens = 20 pts.
* **Liquidity Quality (Max 15 pts):** Logarithmic scaling of narrative liquidity. $5K = 0 pts; $500K = 10 pts; $5M = 15 pts.
* **Transaction Momentum (Max 15 pts):** Scaled 6H transaction count (buys + sells). 100 txns = 0 pts; 10K = 10 pts; 100K = 15 pts.
* **Acceleration (Max 10 pts):**
  * *Volume Acceleration (5 pts):* High ratio of 1H to 6H volume (e.g. &gt;25% gets full 5 points).
  * *Price Acceleration (5 pts):* Positive price changes. Avg 6H price increase of &gt;20% gets full 5 points.
* **Fresh Launches (Max 10 pts):** Number of tokens launched in the last 24 hours. 4+ new tokens = 10 pts.
* **Data Quality (Max 5 pts):** Ratio of tokens with complete profile descriptions or link lists.

### Automatic Dampeners & Penalties
To prevent wash trading, campaigns, or single-token spikes from skewing reports:
1. **Single Token Concentration (-15 pts):** Applied if one token represents &gt;75% of the narrative's total volume.
2. **Extremely Low Liquidity (-20 pts):** Applied if combined narrative liquidity is below $10,000 USD.
3. **Volume-to-Liquidity Ratio (-15 pts):** Applied if 6H volume is 5x greater than liquidity (indicating potential wash trading).
4. **Low Transaction Count (-10 pts):** Applied if 6H transactions are under 100.
5. **Extreme Price Movement (-10 pts):** Applied if average 6H price change is &gt;100% or &lt; -30% (high risk of immediate dump).
6. **Paid Promotion Alert (Warning):** Flagged if &gt;80% of tokens in a narrative are sponsored/boosted.

---

## Setting Up Free Services

### 1. Telegram Bot (via BotFather)
1. Message [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newbot` and follow the prompts to choose a name and username.
3. Copy the returned **API Token** (e.g. `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
4. Save this token as `TELEGRAM_BOT_TOKEN`.

### 2. Database (via Supabase)
1. Sign up for a free account at [Supabase](https://supabase.com).
2. Create a new project. Choose a strong database password and copy your project URL.
3. Go to Project Settings -> API:
   * Copy the **Project URL** (save as `SUPABASE_URL`).
   * Copy the **service_role** API Key (save as `SUPABASE_SERVICE_ROLE_KEY`). *Do not copy the anon key.*
4. Go to the SQL Editor in Supabase, copy the contents of `supabase/migrations/20260808000000_init.sql`, paste it, and click **Run** to set up the database tables.

---

## Local Installation & Run

1. **Clone and Install:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file by copying the template:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the variables in `.env.local`:
   ```dotenv
   NEXT_PUBLIC_APP_URL=https://yourtunnelurl.ngrok-free.app
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGh...
   TELEGRAM_WEBHOOK_SECRET=your_secret_random_webhook_token
   SUPABASE_URL=https://project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   CRON_SECRET=your_secret_random_cron_token
   MIN_LIQUIDITY_USD=5000
   MAX_SCAN_CANDIDATES=150
   MANUAL_SCAN_COOLDOWN_SECONDS=120
   ```

3. **Tunneling for Local Webhooks:**
   Since Telegram needs a public HTTPS URL to deliver updates to your local host, install a tunnel:
   * **With ngrok:**
     ```bash
     ngrok http 3000
     ```
   * **With Localtunnel:**
     ```bash
     npx localtunnel --port 3000
     ```
   Copy the generated HTTPS URL and set it as `NEXT_PUBLIC_APP_URL` in `.env.local`.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Register Webhook:**
   Run the registration helper to bind the bot to your tunnel endpoint:
   ```bash
   npm run telegram:set-webhook
   ```
   To verify registration details:
   ```bash
   npm run telegram:info
   ```

---

## Deployment & Production

### 1. Deploying to Vercel
1. Push your code to a GitHub repository.
2. Connect the repository to a new project in [Vercel](https://vercel.com).
3. Add all environment variables listed in `.env.local`.
4. Deploy the project.
5. Update `NEXT_PUBLIC_APP_URL` in the Vercel dashboard to your live Vercel domain and redeploy (or restart environment variables) so the bot registers the correct production URL.
6. Re-run `npm run telegram:set-webhook` (using your live production domain) to bind the bot to the live URL.

### 2. Configuring the 6-Hour Scheduler
Since Vercel Hobby does not support free long-running cron jobs automatically, configure an external scheduler:
* **Approach A: cron-job.org (Recommended & 100% Free)**
  1. Register a free account at [cron-job.org](https://cron-job.org).
  2. Create a new cron job.
  3. Set URL to: `https://yourdomain.vercel.app/api/cron/scan`
  4. Set Request method to `POST`.
  5. Add an HTTP header: `Authorization` with value `Bearer YOUR_CRON_SECRET`.
  6. Schedule execution for every 6 hours (00:00, 06:00, 12:00, 18:00 UTC).
* **Approach B: Upstash QStash (Free Tier)**
  1. Register at [Upstash](https://upstash.com).
  2. Schedule a recurring POST request to your `/api/cron/scan` route, including the `Authorization` header.

---

## Command Reference

Users inside the Telegram bot can issue the following instructions:
* `/start`: Introduces METIQ, automatically registers the user for reports, and shows the main dashboard inline buttons.
* `/meta`: Forces an on-demand narrative scan (cooldown of 120s applies to prevent API abuse).
* `/latest`: Returns the cached HTML report from the latest successful scan immediately.
* `/subscribe`: Activates automatic 6-hour reports for the chat.
* `/unsubscribe`: Deactivates automatic reports for the chat.
* `/status`: Displays subscriber totals, data source status, and next scheduled scan.
* `/help`: Outlines bot command descriptions.

---

## Testing & Diagnostics

### 1. Verification URLs
* **Service Diagnostics:** `https://yourdomain.vercel.app/api/health`
* **Force Scan Trigger:** `POST https://yourdomain.vercel.app/api/cron/scan` with header `Authorization: Bearer YOUR_CRON_SECRET`.

### 2. Run Test Suite
Run local unit tests:
```bash
npm run test
```

### 3. Verify Code Quality
```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## Security Notes

1. **Service Role Key:** The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row-Level Security rules. It must **never** be exposed in client code or committed to GitHub.
2. **Timing-Safe Checks:** All incoming webhook messages and scheduled cron triggers are verified using Node's timing-safe cryptographic comparisons (`crypto.timingSafeEqual`) to prevent side-channel attacks.
3. **HTML Escaping:** Telegram messages are parsed as HTML. Any dynamic string (token names, symbols, descriptions, error details) is escaped via `escapeHtml` to prevent layout breaks or command injections.
# metiq
