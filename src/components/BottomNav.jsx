import { IconHome, IconTasks, IconSpin, IconFriends, IconWallet } from './Icons.jsx'

const items = [
  { id:'home', label:'Home', Icon: IconHome },
  { id:'tasks', label:'Tasks', Icon: IconTasks },
  { id:'spin', label:'Spin', Icon: IconSpin },
  { id:'friends', label:'Friends', Icon: IconFriends },
  { id:'wallet', label:'Wallet', Icon: IconWallet },
]

export default function BottomNav({ active, onChange }) {
  return (
    <div className="bottom-nav">
      {items.map(({id,label,Icon}) => {
        const isActive = active===id
        return (
          <button key={id} className={`nav-item ${isActive?'active':''}`} onClick={()=>onChange(id)}>
            <span className="nav-icon-wrap"><Icon size={22} active={isActive} /></span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
