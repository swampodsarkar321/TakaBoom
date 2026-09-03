import { CoinSmall } from './Icons.jsx'

export default function Header({ user, balance, level }) {
  const initials = (user?.first_name?.[0] || 'U').toUpperCase()
  return (
    <div className="header">
      <div className="user-pill">
        <div className="avatar">{initials}</div>
        <div>
          <div style={{fontWeight:700, fontSize:13, lineHeight:1}}>{user?.first_name || 'Guest'}</div>
          <div style={{fontSize:11, color:'#8B92B8'}}>@{user?.username || 'user'}</div>
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
