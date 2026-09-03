import { useEffect, useState } from 'react'
import { db, ref, get, update, onValue, off } from './firebase.js'

const ADMIN_PASS = 'Takaboom2025' // change this
const BOT_TOKEN = '8948983611:AAHDaDpVkrmvAJqs8ZRoeR_DV8dE1RfvzKE'

export default function App() {
  const [auth, setAuth] = useState(() => localStorage.getItem('tb_admin') === '1')
  const [pass, setPass] = useState('')
  const [tab, setTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [withdraws, setWithdraws] = useState([])
  const [toast, setToast] = useState(null)
  const [notifText, setNotifText] = useState('')
  const [search, setSearch] = useState('')

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(null), 2500) }

  const handleLogin = () => {
    if (pass === ADMIN_PASS) {
      localStorage.setItem('tb_admin','1')
      setAuth(true)
    } else showToast('Wrong password')
  }

  // Load users realtime
  useEffect(() => {
    if (!auth) return
    const r = ref(db, 'takaboom/users')
    const unsub = onValue(r, snap => {
      if (!snap.exists()) { setUsers([]); setWithdraws([]); return }
      const vals = Object.values(snap.val())
      setUsers(vals)
      // Collect all withdraws with user info
      const allW = []
      vals.forEach(u => {
        if (u.withdraws && Array.isArray(u.withdraws)) {
          u.withdraws.forEach(w => allW.push({ ...w, _userId: u.id, _username: u.username, _name: u.first_name }))
        }
      })
      // Also check takaboom/withdraws path if used
      allW.sort((a,b) => new Date(b.date||0) - new Date(a.date||0))
      setWithdraws(allW)
    })
    return () => off(r)
  }, [auth])

  const handleWithdraw = async (w, status) => {
    const uref = ref(db, `takaboom/users/${w._userId}`)
    const snap = await get(uref)
    if (!snap.exists()) return
    const u = snap.val()
    const updated = (u.withdraws||[]).map(x => x.id===w.id ? {...x, status} : x)
    await update(uref, { withdraws: updated })
    showToast(`Withdraw ${status} - @${w._username}`)
    // Notify user via bot
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          chat_id: w._userId,
          text: status==='Paid' ? `✅ Your withdraw of ৳${(w.amount/1000*5).toFixed(0)} (${w.amount} coins) via ${w.method} is Paid!` : `❌ Your withdraw ${w.amount} coins via ${w.method} is Rejected. Contact support.`,
          parse_mode:'Markdown'
        })
      })
    } catch {}
  }

  const handleBan = async (u) => {
    const isBanned = u.banned
    await update(ref(db, `takaboom/users/${u.id}`), { banned: !isBanned })
    showToast(isBanned ? `Unbanned @${u.username}` : `Banned @${u.username}`)
  }

  const handleGlobalNotif = async () => {
    if (!notifText.trim()) return showToast('Enter message')
    // Save to Firebase for app to show
    await update(ref(db, 'takaboom/global'), { message: notifText, sentAt: new Date().toISOString() })
    // Send to all users via bot (batch)
    let sent = 0
    for (const u of users.slice(0, 50)) { // limit 50 per batch to avoid flood
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ chat_id: u.id, text: `📢 *TakaBoom Announcement*\n\n${notifText}`, parse_mode:'Markdown' })
        })
        sent++
        await new Promise(r=>setTimeout(r, 40))
      } catch {}
    }
    showToast(`Sent to ${sent} users + saved to app`)
    setNotifText('')
  }

  const handleResetUser = async (u) => {
    if (!confirm(`Reset @${u.username} to 0?`)) return
    await update(ref(db, `takaboom/users/${u.id}`), { balance:0, level:1, xp:0, streak:0, adsToday:0, spinsLeft:1, withdraws:[], updatedAt: new Date().toISOString() })
    showToast(`Reset @${u.username}`)
  }

  if (!auth) {
    return (
      <div className="login">
        <div style={{fontWeight:800, fontSize:22, marginBottom:6}}>TakaBoom Admin</div>
        <div style={{color:'#8B92B8', fontSize:13, marginBottom:16}}>Enter admin password to continue</div>
        <input className="input" type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} />
        <button className="btn-send" style={{width:'100%', marginTop:12}} onClick={handleLogin}>Login</button>
        <div style={{fontSize:11, color:'#8B92B8', marginTop:10, textAlign:'center'}}>Default: Takaboom2025</div>
      </div>
    )
  }

  const totalBalance = users.reduce((s,u)=>s+(u.balance||0),0)
  const totalAds = users.reduce((s,u)=>s+(u.adsToday||0),0)
  const totalTaka = (totalBalance/1000*5).toFixed(0)
  const pendingW = withdraws.filter(w=>w.status==='Pending').length
  const totalUsers = users.length

  const filtered = users.filter(u => !search || (u.username||'').toLowerCase().includes(search.toLowerCase()) || String(u.id).includes(search) || (u.first_name||'').toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <div className="header">
        <div className="logo">💥 TakaBoom Admin <span className="badge">LIVE</span></div>
        <div style={{display:'flex', gap:10}}>
          <button className="btn btn-unban" onClick={()=>{localStorage.removeItem('tb_admin'); location.reload()}}>Logout</button>
        </div>
      </div>

      <div className="nav">
        <button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}>Dashboard</button>
        <button className={tab==='users'?'active':''} onClick={()=>setTab('users')}>All Users ({totalUsers})</button>
        <button className={tab==='withdraws'?'active':''} onClick={()=>setTab('withdraws')}>Withdraws ({withdraws.length}) {pendingW>0 && `• ${pendingW} Pending`}</button>
        <button className={tab==='notif'?'active':''} onClick={()=>setTab('notif')}>Global Notification</button>
      </div>

      {tab==='dashboard' && (
        <>
          <div className="grid">
            <div className="stat"><div className="stat-val">{totalUsers}</div><div className="stat-label">Total Users</div></div>
            <div className="stat"><div className="stat-val">{totalBalance.toLocaleString()}</div><div className="stat-label">Total Coins • ৳{totalTaka} Taka</div></div>
            <div className="stat"><div className="stat-val">{totalAds}</div><div className="stat-label">Total Ads Watched Today</div></div>
            <div className="stat"><div className="stat-val" style={{color: pendingW?'#FF3B5C':'#00D68F'}}>{pendingW}</div><div className="stat-label">Pending Withdraws</div></div>
            <div className="stat"><div className="stat-val">{withdraws.filter(w=>w.status==='Paid').length}</div><div className="stat-label">Paid Withdraws</div></div>
            <div className="stat"><div className="stat-val">11718341</div><div className="stat-label">Monetag Zone • In-App + Popup</div></div>
            <div className="stat"><div className="stat-val">1000=5 Taka</div><div className="stat-label">Rate • Min 10000=50 Taka</div></div>
            <div className="stat"><div className="stat-val">{users.filter(u=>u.banned).length}</div><div className="stat-label">Banned Users</div></div>
          </div>

          <div className="card">
            <div style={{fontWeight:700, marginBottom:10}}>Monetag Earnings Estimate (BD)</div>
            <div style={{fontSize:13, color:'#8B92B8', lineHeight:1.8}}>
              • Total Ads {totalAds} × $0.003 = <b style={{color:'#00D68F'}}>${(totalAds*0.003).toFixed(2)}</b> (≈ ৳{(totalAds*0.003*110).toFixed(0)})<br/>
              • If 1000 ads/day → ~$3/day → ৳330/day<br/>
              • In-App auto 2 per 6min = extra ~$0.30/1000 views<br/>
              • Check real earnings: <a href="https://monetag.com" target="_blank" style={{color:'#6C5CFF'}}>monetag.com → Reports</a>
            </div>
          </div>

          <div className="card">
            <div style={{fontWeight:700, marginBottom:10}}>Recent Users</div>
            <table className="table">
              <thead><tr><th>User</th><th>Balance</th><th>Ads</th><th>Level</th><th>Status</th></tr></thead>
              <tbody>
                {users.slice(0,5).map(u=>(
                  <tr key={u.id}><td>@{u.username} ({u.first_name})</td><td>{u.balance} • ৳{(u.balance/1000*5).toFixed(0)}</td><td>{u.adsToday}</td><td>{u.level}</td><td>{u.banned?'🔴 Banned':'🟢 Active'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab==='users' && (
        <div className="card">
          <div style={{display:'flex', gap:10, marginBottom:12}}>
            <input className="input" placeholder="Search @username / ID / name" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:300}} />
            <span style={{alignSelf:'center', color:'#8B92B8', fontSize:12}}>{filtered.length} users</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead><tr><th>ID</th><th>User</th><th>Balance</th><th>Ads</th><th>Spins</th><th>Streak</th><th>Withdraws</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.slice(0,100).map(u=>(
                  <tr key={u.id} style={u.banned?{opacity:0.5, background:'rgba(255,59,92,0.06)'}:{}}>
                    <td><code style={{fontSize:11}}>{u.id}</code></td>
                    <td><b>@{u.username}</b><br/><span style={{fontSize:11, color:'#8B92B8'}}>{u.first_name}</span></td>
                    <td><b>{u.balance}</b><br/><span style={{fontSize:11, color:'#00D68F'}}>৳{(u.balance/1000*5).toFixed(0)}</span></td>
                    <td>{u.adsToday}/30</td>
                    <td>{u.spinsLeft}</td>
                    <td>{u.streak}</td>
                    <td>{(u.withdraws||[]).length}</td>
                    <td style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                      <button className={u.banned?"btn btn-unban":"btn btn-ban"} onClick={()=>handleBan(u)}>{u.banned?"Unban":"Ban"}</button>
                      <button className="btn btn-reject" onClick={()=>handleResetUser(u)}>Reset 0</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='withdraws' && (
        <div className="card">
          <div style={{fontWeight:700, marginBottom:12}}>All Withdraws - Accept / Reject</div>
          {withdraws.length===0 ? <div style={{color:'#8B92B8', textAlign:'center', padding:20}}>No withdraws yet</div> :
          <table className="table">
            <thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {withdraws.map(w=>(
                <tr key={w.id} style={w.status==='Pending'?{background:'rgba(255,184,0,0.06)'}:{}}>
                  <td>@{w._username} ({w._name})<br/><code style={{fontSize:10}}>{w._userId}</code></td>
                  <td><b>{w.amount}</b> = ৳{(w.amount/1000*5).toFixed(0)}</td>
                  <td>{w.method}</td>
                  <td>{w.date}</td>
                  <td><span style={{padding:'3px 8px', borderRadius:999, fontSize:11, fontWeight:700, background: w.status==='Paid'?'#00D68F':w.status==='Rejected'?'#FF3B5C':'#FFB800', color: w.status==='Pending'?'#000':'white'}}>{w.status}</span></td>
                  <td style={{display:'flex', gap:6}}>
                    {w.status==='Pending' && <><button className="btn btn-accept" onClick={()=>handleWithdraw(w,'Paid')}>Accept</button><button className="btn btn-reject" onClick={()=>handleWithdraw(w,'Rejected')}>Reject</button></>}
                    {w.status!=='Pending' && <button className="btn btn-unban" onClick={()=>handleWithdraw(w,'Pending')}>Undo</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          }
        </div>
      )}

      {tab==='notif' && (
        <div className="card">
          <div style={{fontWeight:700, marginBottom:10}}>Global Notification - Send to All Users</div>
          <div style={{fontSize:12, color:'#8B92B8', marginBottom:10}}>Telegram bot diye 50 jon ke per batch pathabe + Firebase e save hobe (app e banner hisabe dekha jabe)</div>
          <textarea className="input" rows={4} placeholder="Ex: TakaBoom e notun offer! Aj 100 ad dekhle 200 bonus..." value={notifText} onChange={e=>setNotifText(e.target.value)} style={{resize:'vertical'}} />
          <button className="btn-send" style={{marginTop:10}} onClick={handleGlobalNotif}>📢 Send to All ({users.length} users)</button>
          <div style={{fontSize:11, color:'#8B92B8', marginTop:8}}>Tip: Max 50 per batch, baki auto next batch e jabe</div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
