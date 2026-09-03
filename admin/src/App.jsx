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
  const [currentGlobal, setCurrentGlobal] = useState(null)

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

  // Load current global notification
  useEffect(() => {
    if (!auth) return
    const gRef = ref(db, 'takaboom/global')
    const unsub = onValue(gRef, snap => {
      if (snap.exists() && snap.val().message) setCurrentGlobal(snap.val())
      else setCurrentGlobal(null)
    })
    return () => off(gRef)
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
          text: status==='Paid' ? `✅ Your withdraw of ৳${(w.amount/1000*4).toFixed(0)} (${w.amount} coins) via ${w.method} is Paid!` : `❌ Your withdraw ${w.amount} coins via ${w.method} is Rejected. Contact support.`,
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

  const handleDeleteGlobal = async () => {
    if (!currentGlobal) return showToast('No active notification')
    if (!confirm(`Delete global notification?\n\n"${currentGlobal.message}"\n\nApp banner will disappear for all users.`)) return
    await remove(ref(db, 'takaboom/global'))
    showToast('Global notification deleted - banner removed')
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
  const totalTaka = (totalBalance/1000*4).toFixed(0)
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
            <div className="stat"><div className="stat-val">1000=4 Taka</div><div className="stat-label">Rate • Min 10000=40 Taka</div></div>
            <div className="stat"><div className="stat-val">{users.filter(u=>u.banned).length}</div><div className="stat-label">Banned Users</div></div>
          </div>

          <div className="card">
            <div style={{fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:8}}>💰 Estimated Earnings - Monetag Zone 11718341 <span style={{background:'rgba(0,214,143,0.12)', color:'#00D68F', fontSize:10, padding:'3px 8px', borderRadius:999, border:'1px solid rgba(0,214,143,0.25)'}}>BD Rate $0.003/ad</span></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:14}}>
              <div style={{background:'rgba(0,214,143,0.08)', border:'1px solid rgba(0,214,143,0.2)', borderRadius:12, padding:14, textAlign:'center'}}>
                <div style={{fontSize:20, fontWeight:800, color:'#00D68F'}}>${(totalAds*0.003).toFixed(2)}</div>
                <div style={{fontSize:11, color:'#8B92B8'}}>Today • {totalAds} ads</div>
                <div style={{fontSize:10, color:'#00D68F'}}>৳{(totalAds*0.003*110).toFixed(0)} Taka</div>
              </div>
              <div style={{background:'var(--card2)', border:'1px solid var(--border)', borderRadius:12, padding:14, textAlign:'center'}}>
                <div style={{fontSize:18, fontWeight:800}}>${(totalAds*0.003*7).toFixed(2)}</div>
                <div style={{fontSize:11, color:'#8B92B8'}}>Weekly (×7)</div>
                <div style={{fontSize:10, color:'#8B92B8'}}>৳{(totalAds*0.003*7*110).toFixed(0)}</div>
              </div>
              <div style={{background:'var(--card2)', border:'1px solid var(--border)', borderRadius:12, padding:14, textAlign:'center'}}>
                <div style={{fontSize:18, fontWeight:800}}>${(totalAds*0.003*30).toFixed(2)}</div>
                <div style={{fontSize:11, color:'#8B92B8'}}>Monthly (×30)</div>
                <div style={{fontSize:10, color:'#8B92B8'}}>৳{(totalAds*0.003*30*110).toFixed(0)}</div>
              </div>
              <div style={{background: (totalAds*0.003 - totalBalance/1000*0.036) >=0 ? 'rgba(0,214,143,0.08)' : 'rgba(255,59,92,0.08)', border:`1px solid ${ (totalAds*0.003 - totalBalance/1000*0.036) >=0 ? 'rgba(0,214,143,0.2)' : 'rgba(255,59,92,0.2)'}`, borderRadius:12, padding:14, textAlign:'center'}}>
                <div style={{fontSize:18, fontWeight:800, color: (totalAds*0.003 - totalBalance/1000*0.036) >=0 ? '#00D68F' : '#FF3B5C'}}>${(totalAds*0.003 - totalBalance/1000*0.036).toFixed(2)}</div>
                <div style={{fontSize:11, color:'#8B92B8'}}>Est. Profit Today</div>
                <div style={{fontSize:10, color:'#8B92B8'}}>Earn - Payout</div>
              </div>
            </div>

            <div style={{background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12}}>
              <div style={{fontWeight:600, fontSize:13, marginBottom:8}}>📊 Breakdown</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:'#8B92B8', lineHeight:1.8}}>
                <div>• Total Ads Today: <b style={{color:'white'}}>{totalAds}</b></div>
                <div>• Avg Ads/User: <b style={{color:'white'}}>{totalUsers? (totalAds/totalUsers).toFixed(1):0}</b></div>
                <div>• Payout Due: <b style={{color:'#FFB800'}}>{totalBalance} coins = ৳{totalTaka} (${(totalBalance/1000*0.036).toFixed(2)})</b></div>
                <div>• Per Ad Earn: <b style={{color:'#00D68F'}}>$0.003</b> • Per Ad Cost: $0.00225 (50 coin)</div>
                <div>• In-App Auto: 2 per 6min = +{(totalUsers*2).toFixed(0)} ads/day est.</div>
                <div>• Real check: <a href="https://monetag.com" target="_blank" style={{color:'#6C5CFF'}}>monetag.com → Reports</a></div>
              </div>
            </div>

            <div style={{background:'var(--card2)', border:'1px solid var(--border)', borderRadius:12, padding:14}}>
              <div style={{fontWeight:600, fontSize:12, marginBottom:10, color:'#8B92B8'}}>7-Day Projection (based on today {totalAds} ads)</div>
              <svg viewBox="0 0 300 80" style={{width:'100%', height:80}}>
                {/* Simple bars for 7 days */}
                <rect x="10" y="60" width="28" height="15" rx="4" fill="#1A2040" stroke="#242E5A" />
                <rect x="48" y="45" width="28" height="30" rx="4" fill="#242E5A" />
                <rect x="86" y="50" width="28" height="25" rx="4" fill="#242E5A" />
                <rect x="124" y="35" width="28" height="40" rx="4" fill="#242E5A" />
                <rect x="162" y="40" width="28" height="35" rx="4" fill="#6C5CFF" opacity="0.6" />
                <rect x="200" y="30" width="28" height="45" rx="4" fill="#6C5CFF" opacity="0.8" />
                <rect x="238" y="20" width="28" height="55" rx="4" fill="#00D68F" />
                <text x="24" y="78" fontSize="7" fill="#8B92B8">D1</text>
                <text x="62" y="78" fontSize="7" fill="#8B92B8">D2</text>
                <text x="100" y="78" fontSize="7" fill="#8B92B8">D3</text>
                <text x="138" y="78" fontSize="7" fill="#8B92B8">D4</text>
                <text x="176" y="78" fontSize="7" fill="#8B92B8">D5</text>
                <text x="214" y="78" fontSize="7" fill="#8B92B8">D6</text>
                <text x="252" y="78" fontSize="7" fill="#00D68F" fontWeight="700">Today</text>
              </svg>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'#8B92B8', marginTop:4}}>
                <span>Est. $ {(totalAds*0.003*0.6).toFixed(2)}</span>
                <span style={{color:'#00D68F', fontWeight:700}}>Today ${ (totalAds*0.003).toFixed(2)} • Profit ${(totalAds*0.003 - totalBalance/1000*0.036).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{fontWeight:700, marginBottom:10}}>Recent Users</div>
            <table className="table">
              <thead><tr><th>User</th><th>Balance</th><th>Ads</th><th>Level</th><th>Status</th></tr></thead>
              <tbody>
                {users.slice(0,5).map(u=>(
                  <tr key={u.id}><td>@{u.username} ({u.first_name})</td><td>{u.balance} • ৳{(u.balance/1000*4).toFixed(0)}</td><td>{u.adsToday}</td><td>{u.level}</td><td>{u.banned?'🔴 Banned':'🟢 Active'}</td></tr>
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
                    <td><b>{u.balance}</b><br/><span style={{fontSize:11, color:'#00D68F'}}>৳{(u.balance/1000*4).toFixed(0)}</span></td>
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
                  <td><b>{w.amount}</b> = ৳{(w.amount/1000*4).toFixed(0)}</td>
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
          {currentGlobal && (
            <div style={{background:'rgba(255,184,0,0.08)', border:'1px solid rgba(255,184,0,0.2)', borderRadius:12, padding:12, marginBottom:12}}>
              <div style={{fontWeight:600, fontSize:12, color:'#FFB800', marginBottom:6}}>📢 Active Global Notification:</div>
              <div style={{fontSize:13, color:'white', background:'var(--bg)', padding:10, borderRadius:8, border:'1px solid var(--border)', lineHeight:1.5}}>{currentGlobal.message}</div>
              <div style={{fontSize:11, color:'#8B92B8', marginTop:6}}>Sent: {new Date(currentGlobal.sentAt).toLocaleString()} • App banner e show hocche</div>
              <button className="btn btn-reject" style={{marginTop:8}} onClick={handleDeleteGlobal}>🗑️ Delete - Banner soraw</button>
            </div>
          )}
          <textarea className="input" rows={4} placeholder="Ex: TakaBoom e notun offer! Aj 100 ad dekhle 200 bonus..." value={notifText} onChange={e=>setNotifText(e.target.value)} style={{resize:'vertical'}} />
          <button className="btn-send" style={{marginTop:10}} onClick={handleGlobalNotif}>📢 Send to All ({users.length} users)</button>
          <div style={{fontSize:11, color:'#8B92B8', marginTop:8}}>Tip: Max 50 per batch, baki auto next batch e jabe • Chaile Active ta Delete kore banner sorate parbe</div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
