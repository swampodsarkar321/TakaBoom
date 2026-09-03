# TakaBoom - World Best Telegram Earning Mini App

Premium Telegram Mini App built with React + Vite. Ready for Vercel + GitHub.

## Features
- 💰 Watch Ads (Monitag / Adsgram) - 50 coins per ad, 15s cooldown, daily limit
- 🔥 Daily Check-in Streak (7 days, up to 1000 coins)
- 📋 Tasks System + Premium Tasks
- 🎡 Lucky Spin Wheel
- 👥 Referral System (15% commission + 500 coins/friend)
- 💳 Wallet with bKash/Nagad/USDT Withdraw
- 🏆 Leaderboard + Level/XP System
- Telegram WebApp SDK integration (haptics, theme, user)

## Quick Start

### 1. Install
```bash
npm install
npm run dev
```

### 2. Monitag Setup
In `index.html` uncomment:
```html
<script src='//libtl.com/sdk.js' data-zone='YOUR_ZONE_ID' data-sdk='show_YOUR_ZONE_ID'></script>
```
And in `src/App.jsx` set:
```js
const AD_ZONE_ID = 'YOUR_ZONE_ID'
```

Adsgram alternative: add `https://sad.adsgram.ai/js/sad.min.js` and set blockId.

Without keys, app runs in MOCK mode (1.8s simulated ad).

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "TakaBoom initial"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/earning-app.git
git push -u origin main
```

### 4. Deploy to Vercel
1. vercel.com -> Add New Project -> Import GitHub repo
2. Framework: Vite (auto)
3. Deploy -> you get https://your-app.vercel.app
4. BotFather -> /mybots -> Bot Settings -> Menu Button -> set URL to vercel URL
5. BotFather -> /newapp -> set Web App URL

### 5. Backend (Recommended)
Current version uses localStorage (demo). For production, connect Supabase/Firebase:
- Verify `initData` on backend
- Store balance/tasks in DB
- Validate ad reward server-side (anti-cheat)

Env example:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AD_ZONE_ID=
```

## Build
```bash
npm run build
npm run preview
```

## Tech
React 18, Vite 5, Pure CSS (Glassmorphism), Telegram WebApp SDK

## Monetization Notes
- Monitag Rewarded Interstitial is best for Mini Apps
- Keep 15s cooldown + daily limit to avoid ban
- Always validate reward server-side

Made for Telegram Mini Apps - Works outside Telegram too (Demo User mode).
