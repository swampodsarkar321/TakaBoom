import { CoinSmall } from './Icons.jsx'

export default function Header({ user, balance, level }) {
  const initials = (user?.first_name?.[0] || 'U').toUpperCase()
  const isVerified = !!user?.username && user.username !== 'demo'
  return (
    <div className="header">
      <div className="user-pill">
        <div className="avatar">{initials}</div>
        <div>
          <div style={{fontWeight:700, fontSize:13, lineHeight:1, display:'flex', alignItems:'center', gap:4}}>
            {user?.first_name || 'Guest'}
            {isVerified && <span style={{background:'#00D68F', color:'white', fontSize:8, width:14, height:14, borderRadius:'50%', display:'grid', placeItems:'center', fontWeight:900}}>✓</span>}
          </div>
          <div style={{fontSize:11, color: isVerified ? '#00D68F' : '#8B92B8', display:'flex', alignItems:'center', gap:3}}>
            @{user?.username || 'user'} {isVerified ? '• Verified' : '• Demo'}
          </div>
        </div>
        <span className="level-badge">LVL {level}</span>
      </div>
      <div className="balance-top">
        <CoinSmall size={20} />
        <span>{balance.toLocaleString()}</span>
      </div>
    </div>
  )
}
