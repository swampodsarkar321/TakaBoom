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
        const userData = {
          id: u.id,
          first_name: u.first_name || 'User',
          username: u.username || '',
          photo_url: u.photo_url || null,
          initData: telegram.initData || '',
        }
        setUser(userData)
        // Direct username system - persist for backend verification
        try {
          localStorage.setItem('takaboom_user', JSON.stringify(userData))
          // Optional: sync to backend for referral tracking
          // fetch('https://takaboom.vercel.app/api/auth', { method:'POST', body: JSON.stringify(userData) })
        } catch {}
      } else {
        // fallback for browser testing - try stored user
        try {
          const stored = JSON.parse(localStorage.getItem('takaboom_user') || 'null')
          if (stored) setUser(stored)
          else setUser({ id: 123456, first_name: 'Demo User', username: 'demo', photo_url: null })
        } catch {
          setUser({ id: 123456, first_name: 'Demo User', username: 'demo', photo_url: null })
        }
      }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('takaboom_user') || 'null')
        if (stored) setUser(stored)
        else setUser({ id: 123456, first_name: 'Demo User', username: 'demo', photo_url: null })
      } catch {
        setUser({ id: 123456, first_name: 'Demo User', username: 'demo', photo_url: null })
      }
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
