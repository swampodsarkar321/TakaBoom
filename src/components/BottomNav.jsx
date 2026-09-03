const items = [
  { id:'home', label:'Home', icon:'🏠' },
  { id:'tasks', label:'Tasks', icon:'📋' },
  { id:'spin', label:'Spin', icon:'🎡' },
  { id:'friends', label:'Friends', icon:'👥' },
  { id:'wallet', label:'Wallet', icon:'💳' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <div className="bottom-nav">
      {items.map(it => (
        <button key={it.id} className={`nav-item ${active===it.id?'active':''}`} onClick={()=>onChange(it.id)}>
          <span className="nav-icon-wrap">{it.icon}</span>
          {it.label}
        </button>
      ))}
    </div>
  )
}
