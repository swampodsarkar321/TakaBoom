// Central ad handler - supports Monitag (libtl.com) + Adsgram + Mock
export async function showRewardedAd(zoneId) {
  // 1) Try Monitag / Monetag SDK (libtl.com)
  // window.show_XXXXXXX() is auto-created when script with data-sdk="show_XXXXXXX" loads
  const monitagFunc = zoneId ? window[`show_${zoneId}`] : null
  if (typeof monitagFunc === 'function') {
    return monitagFunc()
  }
  // 2) Try Adsgram
  if (window.Adsgram) {
    // Adsgram init: window.Adsgram.init({ blockId: "123" })
    // For demo we try generic
    try {
      const AdController = window.Adsgram.init({ blockId: zoneId || 'int-123' })
      const res = await AdController.show()
      return res
    } catch (e) {
      console.warn('Adsgram failed', e)
    }
  }
  // 3) Fallback mock ad (5 sec simulated) - so app works without keys
  return new Promise((resolve) => {
    // simulate ad view
    setTimeout(() => resolve({ mock: true }), 1800)
  })
}

export function isAdReady(zoneId) {
  if (zoneId && typeof window[`show_${zoneId}`] === 'function') return true
  if (window.Adsgram) return true
  return true // mock always ready
}
