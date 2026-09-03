 // World Best - Original SVG Icons (No Emoji/Sticker) - All custom drawn
import React from 'react'

// ============== ORIGINAL GOLD COIN - Realistic 3D ==============
export function CoinSVG({ size = 56, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="coinFace" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFF8C6" />
          <stop offset="18%" stopColor="#FFEC8B" />
          <stop offset="42%" stopColor="#FFD54F" />
          <stop offset="68%" stopColor="#FFB800" />
          <stop offset="88%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#E65100" />
        </radialGradient>
        <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="25%" stopColor="#FFB800" />
          <stop offset="50%" stopColor="#FF8C00" />
          <stop offset="75%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
        <linearGradient id="coinEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
        <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>
      {/* Shadow */}
      <ellipse cx="50" cy="88" rx="32" ry="7" fill="rgba(0,0,0,0.22)" />
      {/* Rim outer */}
      <circle cx="50" cy="50" r="46" fill="url(#coinRim)" filter="url(#coinShadow)" />
      <circle cx="50" cy="50" r="42" fill="url(#coinEdge)" opacity="0.9" />
      {/* Face */}
      <circle cx="50" cy="50" r="38.5" fill="url(#coinFace)" stroke="#8D4A00" strokeWidth="0.7" />
      {/* Inner bevel */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(141,74,0,0.18)" strokeWidth="1" />
      {/* Shine highlight */}
      <ellipse cx="34" cy="28" rx="16" ry="11" fill="rgba(255,255,255,0.42)" />
      <ellipse cx="31" cy="24" rx="7" ry="5" fill="rgba(255,255,255,0.75)" />
      {/* $ Symbol - custom */}
      <text x="50" y="64" textAnchor="middle" fontFamily="Space Grotesk, Outfit, sans-serif" fontWeight="900" fontSize="42" fill="#5D2800" style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.6))' }}>$</text>
      {/* Small dots rim */}
      <g fill="#5D2800" opacity="0.9">
        <circle cx="50" cy="12.5" r="1.4" />
        <circle cx="50" cy="87.5" r="1.4" />
        <circle cx="12.5" cy="50" r="1.4" />
        <circle cx="87.5" cy="50" r="1.4" />
      </g>
    </svg>
  )
}

export function CoinSmall({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="csFace" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFF8C6" />
          <stop offset="40%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FF8C00" />
        </radialGradient>
        <linearGradient id="csRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEC8B" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#csRim)" />
      <circle cx="50" cy="50" r="38" fill="url(#csFace)" />
      <text x="50" y="66" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="900" fontSize="48" fill="#5D2800">$</text>
    </svg>
  )
}

export function CoinTiny({ size = 14 }) {
  return <CoinSmall size={size} />
}

// ============== NAV & UI ICONS - Stroke style (Lucide-like) ==============
const iconProps = (size, color) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round"
})

export function IconHome({ size=20, active }) {
  return (
    <svg {...iconProps(size, active ? '#6C5CFF' : 'currentColor')}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" fill={active ? 'rgba(108,92,255,0.15)' : 'none'} stroke={active ? '#6C5CFF' : 'currentColor'} />
    </svg>
  )
}
export function IconTasks({ size=20, active }) {
  return (
    <svg {...iconProps(size, active ? '#6C5CFF' : 'currentColor')}>
      <rect x="4" y="3" width="16" height="18" rx="2" fill={active ? 'rgba(108,92,255,0.15)' : 'none'} />
      <path d="M8 8h8M8 12h8M8 16h5" />
      {active && <circle cx="17" cy="7" r="2" fill="#6C5CFF" stroke="none" />}
    </svg>
  )
}
export function IconSpin({ size=20, active }) {
  return (
    <svg {...iconProps(size, active ? '#6C5CFF' : 'currentColor')}>
      <circle cx="12" cy="12" r="9" fill={active ? 'rgba(108,92,255,0.12)' : 'none'} />
      <path d="M12 12L12 3M12 12l7.5 4.3M12 12l-7.5 4.3" />
      <circle cx="12" cy="12" r="2.5" fill={active ? '#6C5CFF' : 'currentColor'} stroke="none" />
    </svg>
  )
}
export function IconFriends({ size=20, active }) {
  return (
    <svg {...iconProps(size, active ? '#6C5CFF' : 'currentColor')}>
      <circle cx="9" cy="8" r="3.2" fill={active ? 'rgba(108,92,255,0.15)' : 'none'} />
      <path d="M5.5 18a4 4 0 0 1 7 0" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.2 16.5a3 3 0 0 1 3.8 2.5" />
    </svg>
  )
}
export function IconWallet({ size=20, active }) {
  return (
    <svg {...iconProps(size, active ? '#6C5CFF' : 'currentColor')}>
      <rect x="3" y="5" width="18" height="14" rx="2" fill={active ? 'rgba(108,92,255,0.12)' : 'none'} />
      <path d="M3 9h18M16 13a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" fill={active ? '#6C5CFF' : 'currentColor'} stroke="none" />
    </svg>
  )
}
export function IconPlay({ size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="white" opacity="0.12" stroke="white" strokeWidth="1.5" />
      <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="white" />
    </svg>
  )
}
export function IconFlame({ size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2c0 3-3.5 5.5-3.5 9a3.5 3.5 0 0 0 7 0c0-3.5-3.5-6-3.5-9z" fill="#FF6B00" stroke="#7A2E00" strokeWidth="1.2" />
      <path d="M12 8c0 1.5-1.2 2.5-1.2 4a1.2 1.2 0 0 0 2.4 0c0-1.5-1.2-2.5-1.2-4z" fill="#FFD54F" />
    </svg>
  )
}
export function IconVideo({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="12" rx="2" />
      <path d="M16 8l5-2v8l-5-2z" fill="currentColor" stroke="none" />
      <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function IconGift({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="12" rx="1.5" fill="#FFB800" stroke="#7A2E00" strokeWidth="1.3" />
      <path d="M12 8V20" stroke="#7A2E00" strokeWidth="1.3" />
      <path d="M3 12h18" stroke="#7A2E00" strokeWidth="1.3" />
      <path d="M8 8c0-2 2-3.5 4-2 2-1.5 4 0 4 2 0 1.5-1.2 2.8-4 4-2.8-1.2-4-2.5-4-4z" fill="#FF3B5C" stroke="#7A2E00" strokeWidth="1.1" />
    </svg>
  )
}
export function IconCheck({ size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill="#00D68F" stroke="none" />
      <path d="M8 12l2.8 2.8L16 9.2" stroke="white" />
    </svg>
  )
}
export function IconClock({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
export function IconTrophy({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v4a6 6 0 0 1-12 0V4z" fill="#FFD54F" stroke="#7A2E00" strokeWidth="1.3" />
      <path d="M6 6H4a2 2 0 0 0 2 4M18 6h2a2 2 0 0 1-2 4" stroke="#7A2E00" strokeWidth="1.3" fill="none" />
      <path d="M12 14v4M8 20h8" stroke="#7A2E00" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="12" cy="10" rx="3" ry="2" fill="rgba(255,255,255,0.45)" />
    </svg>
  )
}
export function IconZap({ size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFB800" stroke="#7A2E00" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M13 2L4 14h5l-1 8 9-12h-5l1-8z" />
    </svg>
  )
}
export function IconMegaphone({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 10a2 2 0 0 1 2-2h8l4-3v12l-4-3H6a2 2 0 0 1-2-2v-2z" fill="currentColor" opacity="0.12" />
      <path d="M12 15a3 3 0 0 0 3 3" />
    </svg>
  )
}
export function IconTwitterX({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 3H21l-6.1 7L22 21h-6.2l-4.8-6.3L5.5 21H3l6.5-7.5L3 3h6.3l4.3 5.7L18.9 3zM17 19h1.7L7 5H5.2L17 19z" />
    </svg>
  )
}
export function IconGamepad({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="8" width="18" height="10" rx="5" />
      <circle cx="8" cy="13" r="1" fill="currentColor" />
      <path d="M12 12v4M10 14h4" />
      <circle cx="16" cy="13.5" r="1" fill="currentColor" />
    </svg>
  )
}
export function IconShield({ size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v5c0 4.2-2.8 8-7 10-4.2-2-7-5.8-7-10V6l7-3z" fill="rgba(0,214,143,0.15)" stroke="#00D68F" strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" stroke="#00D68F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function IconWithdraw({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 12h10M12 7v10" opacity="0.0" />
      <circle cx="16.5" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M7 10h6M7 14h4" strokeLinecap="round" />
    </svg>
  )
}
export function IconCopy({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </svg>
  )
}
export function IconSend({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" fill="currentColor" opacity="0.12" />
    </svg>
  )
}
export function IconStar({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFB800" stroke="#7A2E00" strokeWidth="1.2">
      <path d="M12 3l2.3 5.2H20l-4.7 3.4 1.8 5.4L12 14.7l-5.1 2.3 1.8-5.4L4 8.2h5.7z" />
    </svg>
  )
}
