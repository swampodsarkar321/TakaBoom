export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, msg: 'TakaBoom webhook alive' })
  }

  const BOT_TOKEN = process.env.BOT_TOKEN || '8948983611:AAHDaDpVkrmvAJqs8ZRoeR_DV8dE1RfvzKE'
  const WEB_APP_URL = 'https://takaboom.vercel.app/'

  const update = req.body

  try {
    // Handle /start command
    const msg = update.message
    if (msg && msg.text) {
      const chatId = msg.chat.id
      const text = msg.text
      const from = msg.from

      if (text.startsWith('/start')) {
        const startParam = text.split(' ')[1] || ''
        const name = from.first_name || 'Friend'

        // Extract referrer if any
        let referralNote = ''
        if (startParam) referralNote = `\n\n🎁 Invited by: ${startParam}`

        const welcomeText = `💥 *Welcome to TakaBoom, ${name}!*${referralNote}\n\n` +
          `🪙 *World Best Earning App*\n` +
          `▶️ Watch Ads & Earn 50 Coins\n` +
          `🎡 Spin & Win up to 500 Coins\n` +
          `🔥 Daily Check-in 7 Days Bonus\n` +
          `👥 Invite Friends = 500 Coins + 15% Lifetime\n` +
          `💳 Withdraw via bKash / Nagad / USDT\n\n` +
          `👇 Tap below to open TakaBoom!`

        const payload = {
          chat_id: chatId,
          text: welcomeText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💥 Open TakaBoom', web_app: { url: WEB_APP_URL } }],
              [{ text: '👥 Invite Friends', url: `https://t.me/BoomTakaBd_bot?start=${from.id}` }, { text: '📢 Channel', url: 'https://t.me/' }]
            ]
          }
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else if (text === '/help') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: msg.chat.id,
            text: '🆘 *TakaBoom Help*\n\n' +
                  '• Watch Ad = 50 coins\n' +
                  '• Daily Check-in = up to 1000 coins\n' +
                  '• Spin = 3 free daily\n' +
                  '• Min withdraw 5000 coins\n\n' +
                  'Support: @BoomTakaBd_bot',
            parse_mode: 'Markdown'
          })
        })
      }
    }

    // Handle callback queries etc. if needed

  } catch (e) {
    console.error('webhook error', e)
  }

  // Always return ok to Telegram
  return res.status(200).json({ ok: true })
}
