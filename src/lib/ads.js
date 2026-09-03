// TakaBoom - Monetag Zone 11718341 - 3 Formats Best Fit
// Debug enabled to find why ads not showing

export async function showRewardedInterstitial(zoneId = '11718341') {
  const fn = window[`show_${zoneId}`]
  console.log('[TakaBoom Ads] showRewardedInterstitial check:', `show_${zoneId}`, typeof fn, fn ? 'exists' : 'NOT FOUND - SDK not loaded or domain not whitelisted')
  if (typeof fn === 'function') {
    try {
      const res = await fn()
      console.log('[TakaBoom Ads] interstitial success', res)
      return { success: true, type: 'interstitial', res }
    } catch (e) {
      console.warn('[TakaBoom Ads] interstitial error', e)
      throw e
    }
  }
  // Debug: check SDK script
  const sdkScript = document.querySelector(`script[data-zone="${zoneId}"]`)
  console.warn('[TakaBoom Ads] SDK script found?', !!sdkScript, sdkScript?.src)
  console.warn('[TakaBoom Ads] All show_* functions:', Object.keys(window).filter(k => k.startsWith('show_')))
  throw new Error('Monetag SDK not loaded - check domain whitelist in Monetag dashboard (add takaboom.vercel.app) or ad blocker')
}

export async function showRewardedPopup(zoneId = '11718341') {
  const fn = window[`show_${zoneId}`]
  console.log('[TakaBoom Ads] showRewardedPopup check:', `show_${zoneId}`, typeof fn)
  if (typeof fn === 'function') {
    try {
      const res = await fn('pop')
      console.log('[TakaBoom Ads] popup success', res)
      return { success: true, type: 'popup', res }
    } catch (e) {
      console.warn('[TakaBoom Ads] popup error', e)
      throw e
    }
  }
  throw new Error('Monetag SDK not loaded')
}

export async function showInAppInterstitial(zoneId = '11718341', settings) {
  const fn = window[`show_${zoneId}`]
  console.log('[TakaBoom Ads] showInApp check:', `show_${zoneId}`, typeof fn)
  if (typeof fn === 'function') {
    try {
      const res = await fn({
        type: 'inApp',
        inAppSettings: settings || {
          frequency: 2,
          capping: 0.1,
          interval: 30,
          timeout: 5,
          everyPage: false
        }
      })
      console.log('[TakaBoom Ads] inApp success', res)
      return res
    } catch (e) {
      console.warn('[TakaBoom Ads] inApp error', e)
      throw e
    }
  }
  return Promise.resolve({ mock: true })
}

// Legacy wrapper
export async function showRewardedAd(zoneId = '11718341') {
  return showRewardedInterstitial(zoneId)
}

export function isAdReady(zoneId = '11718341') {
  return typeof window[`show_${zoneId}`] === 'function'
}
