export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, msg: 'TakaBoom webhook alive' })
  }

  const BOT_TOKEN = process.env.BOT_TOKEN || '8948983611:AAHDaDpVkrmvAJqs8ZRoeR_DV8dE1RfvzKE'
  const WEB_APP_URL = 'https://takaboom.vercel.app/'

  const update = req.body

  try {
    const msg = update.message
    if (msg && msg.text) {
      const chatId = msg.chat.id
      const text = msg.text.trim()
      const from = msg.from
      const name = from.first_name || 'Friend'
      const username = from.username ? `@${from.username}` : `@user${from.id}`

      if (text.startsWith('/start')) {
        const startParam = text.split(' ')[1] || ''

        // Referral bonus message
        let referralBlock = ''
        if (startParam) {
          referralBlock = `🎁 *Referral Bonus Activated!*\nInvited by ID: \`${startParam}\`\nYou & your friend will get 500 bonus coins after 5 ads! 🎉\n\n`
        } else {
          referralBlock = `🎉 *Welcome Bonus: 50 Coins credited!*\n\n`
        }

        // Beautiful classic message - TakaBoom premium style
        const welcomeText =
          `💥 ━━━━━━━━━━━━━━ 💥\n` +
          `   💰 *T A K A  B O O M* 💰\n` +
          `💥 ━━━━━━━━━━━━━━ 💥\n\n` +
          `👋 Hey *${name}* ${username}!\n` +
          `Welcome to *World's Best Earning App* 🌍\n\n` +
          referralBlock +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💎 *YOUR EARNING MENU:*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `▶️  *Watch Ads* → 50 Coins / ad (30/day)\n` +
          `🎡  *Lucky Spin* → Win up to 500 Coins\n` +
          `🔥  *Daily Check-in* → Up to 1000 Coins\n` +
          `⛏️  *Taka Vault* → Auto Earn + Claim\n` +
          `👥  *Invite Friends* → 500 Coins + 15% Lifetime\n` +
          `💳  *Instant Withdraw* → bKash / Nagad / USDT\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⚡ *Direct Login:* Your Telegram username \`${username}\` auto-connected!\n` +
          `No password needed — just tap Open! 👇\n\n` +
          `🔒 *100% Safe & Anti-Fraud Protected*`

        const payload = {
          chat_id: chatId,
          text: welcomeText,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [{ text: '💥 Open TakaBoom - Earn Now', web_app: { url: WEB_APP_URL } }],
              [
                { text: '👥 Invite & Earn 500', url: `https://t.me/BoomTakaBd_bot?start=${from.id}` },
                { text: '📢 Join Channel', url: 'https://t.me/' }
              ],
              [{ text: '🎁 Claim Daily Bonus', web_app: { url: WEB_APP_URL } }]
            ]
          }
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        // Also send a follow-up media-like stats card as second message after 0.5s
        setTimeout(async () => {
          try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `📊 *Your TakaBoom Stats* for ${username}\n\n` +
                      `🆔 ID: \`${from.id}\`\n` +
                      `👤 Username: ${username} ✅ Verified\n` +
                      `💰 Balance: 1,250 Coins (Demo)\n` +
                      `🏆 Level: 3 | Streak: 2 days 🔥\n\n` +
                      `💡 *Tip:* Share your link to earn 15% forever!`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '🚀 Open App & Check Balance', web_app: { url: WEB_APP_URL } }]
                  ]
                }
              })
            })
          } catch {}
        }, 600)
      } else if (text === '/help' || text === '/balance' || text === '/invite' || text === '/withdraw') {
        const helpText =
          `🆘 *TakaBoom Help - ${username}*\n\n` +
          `💥 *Commands:*\n` +
          `/start - Open TakaBoom\n` +
          `/balance - Check coins (in App)\n` +
          `/invite - Get invite link\n` +
          `/withdraw - Withdraw (in App)\n\n` +
          `💎 *How to Earn:*\n` +
          `• Watch Ad = 50 coins (15s cooldown)\n` +
          `• Daily Check-in = 50-1000 coins\n` +
          `• Spin = 3 free daily, win 500\n` +
          `• Vault Claim = Watch ad to claim\n` +
          `• Min withdraw 5000 coins ($0.60)\n\n` +
          `🔒 Username \`${username}\` auto-connected to Web App!\n` +
          `Support: @BoomTakaBd_bot`

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: msg.chat.id,
            text: helpText,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '💥 Open TakaBoom', web_app: { url: WEB_APP_URL } }]]
            }
          })
        })
      }
    }
  } catch (e) {
    console.error('webhook error', e)
  }

  return res.status(200).json({ ok: true })
}
