// TakaBoom - Monetag Zone 11718341 - 3 Formats Best Fit
// Rewarded Interstitial -> Watch Ad, Spin, Vault (user initiated, reward)
// Rewarded Popup -> Premium Tasks high reward (direct offer)
// In-App Interstitial -> Auto passive (no reward, timeframe)

export async function showRewardedInterstitial(zoneId = '11718341') {
  const fn = window[`show_${zoneId}`]
  if (typeof fn === 'function') {
    // Rewarded interstitial: show_11718341().then(reward)
    return fn().then(() => ({ success: true, type: 'interstitial' }))
  }
  // fallback mock
  return new Promise((resolve) => setTimeout(() => resolve({ mock: true }), 1800))
}

export async function showRewardedPopup(zoneId = '11718341') {
  const fn = window[`show_${zoneId}`]
  if (typeof fn === 'function') {
    // Rewarded Popup: show_11718341('pop').then(reward)
    return fn('pop').then(() => ({ success: true, type: 'popup' }))
  }
  return new Promise((resolve) => setTimeout(() => resolve({ mock: true }), 1800))
}

export async function showInAppInterstitial(zoneId = '11718341', settings) {
  const fn = window[`show_${zoneId}`]
  if (typeof fn === 'function') {
    // In-App Interstitial with timeframe
    return fn({
      type: 'inApp',
      inAppSettings: settings || {
        frequency: 2,
        capping: 0.1,
        interval: 30,
        timeout: 5,
        everyPage: false
      }
    })
  }
  return Promise.resolve({ mock: true })
}

// Legacy wrapper for Watch Ad (uses Rewarded Interstitial)
export async function showRewardedAd(zoneId = '11718341') {
  return showRewardedInterstitial(zoneId)
}

export function isAdReady(zoneId = '11718341') {
  return typeof window[`show_${zoneId}`] === 'function'
}
