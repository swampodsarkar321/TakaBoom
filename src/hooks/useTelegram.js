import { useEffect, useState } from 'react'

export function useTelegram() {
  const [user, setUser] = useState(null)
  const [tg, setTg] = useState(null)

  useEffect(() => {
    const telegram = window.Telegram?.WebApp
    if (telegram) {
      telegram.ready()
      telegram.expand()
      telegram.enableClosingConfirmation?.()
      // theme
      try { telegram.setHeaderColor?.('#070A14') } catch {}
      try { telegram.setBackgroundColor?.('#070A14') } catch {}

      setTg(telegram)
      const u = telegram.initDataUnsafe?.user
      if (u) {
        setUser({
          id: u.id,
          first_name: u.first_name || 'User',
          username: u.username || '',
          photo_url: u.photo_url || null,
        })
      } else {
        // fallback for browser testing
        setUser({ id: 123456, first_name: 'Demo User', username: 'demo', photo_url: null })
      }
    } else {
      setUser({ id: 123456, first_name: 'Demo User', username: 'demo', photo_url: null })
    }
  }, [])

  const haptic = (type='light') => {
    try { tg?.HapticFeedback?.impactOccurred(type) } catch {}
  }
  const hapticSuccess = () => {
    try { tg?.HapticFeedback?.notificationOccurred('success') } catch {}
  }

  return { tg, user, haptic, hapticSuccess }
}
