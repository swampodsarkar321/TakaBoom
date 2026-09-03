import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import { useTelegram } from './hooks/useTelegram.js'
import { showRewardedAd } from './lib/ads.js'

// --- Config ---
const AD_ZONE_ID = 'YOUR_ZONE_ID' // Replace with real Monitag Zone ID, e.g. '1234567'
const COIN_PER_AD = 50
const DAILY_REWARDS = [50,100,150,250,400,600,1000]
const WITHDRAW_MIN = 5000
const RATE_USD_PER_1000 = 0.12 // 1000 coin = $0.12

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('earnapp_state') || 'null')
    return s
  } catch { return null }
}
function saveState(s) {
  localStorage.setItem('earnapp_state', JSON.stringify(s))
}

export default function App() {
  const { user, haptic, hapticSuccess } = useTelegram()
  const [tab, setTab] = useState('home')
  const [toast, setToast] = useState(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawMethod, setWithdrawMethod] = useState('bKash')
  const [withdrawAcc, setWithdrawAcc] = useState('')

  // core state
  const [balance, setBalance] = useState(() => loadState()?.balance ?? 1250)
  const [level, setLevel] = useState(() => loadState()?.level ?? 3)
  const [xp, setXp] = useState(() => loadState()?.xp ?? 340)
  const [streak, setStreak] = useState(() => loadState()?.streak ?? 2)
  const [lastCheckin, setLastCheckin] = useState(() => loadState()?.lastCheckin ?? null)
  const [adsToday, setAdsToday] = useState(() => loadState()?.adsToday ?? 7)
  const [adsLimit] = useState(30)
  const [adCooldown, setAdCooldown] = useState(0)
  const [isAdLoading, setIsAdLoading] = useState(false)
  const [spinDeg, setSpinDeg] = useState(0)
  const [spinsLeft, setSpinsLeft] = useState(() => loadState()?.spinsLeft ?? 3)
  const [tasks, setTasks] = useState(() => loadState()?.tasks ?? [
    { id:1, title:'Join Telegram Channel', icon:'📢', reward:200, done:false, color:'#6C5CFF', link:'https://t.me/' },
    { id:2, title:'Follow X (Twitter)', icon:'🐦', reward:150, done:false, color:'#1DA1F2', link:'https://x.com/' },
    { id:3, title:'Watch 5 Ads Today', icon:'🎬', reward:300, done:false, progress: 7, total:5, color:'#00E5CC' },
    { id:4, title:'Invite 3 Friends', icon:'🎁', reward:500, done:false, progress:1, total:3, color:'#FFB800' },
    { id:5, title:'Daily Check-in 7 Days', icon:'🔥', reward:800, done:false, color:'#FF3B5C' },
  ])
  const [referrals] = useState(12)
  const [withdraws, setWithdraws] = useState(() => loadState()?.withdraws ?? [
    { id:1, amount:5000, method:'bKash', status:'Paid', date:'2025-08-28' },
  ])
  const [leaderboard] = useState([
    { name:'Alex Max', coins:45230, avatar:'AM' },
    { name:'Sara Khan', coins:38900, avatar:'SK' },
    { name:'Minhaj Uddin', coins:34100, avatar:'MU' },
    { name:'You', coins: 1250, avatar:'YO', isYou:true },
    { name:'Crypto King', coins:28900, avatar:'CK' },
  ])

  useEffect(() => {
    saveState({ balance, level, xp, streak, lastCheckin, adsToday, spinsLeft, tasks, withdraws })
  }, [balance, level, xp, streak, lastCheckin, adsToday, spinsLeft, tasks, withdraws])

  useEffect(() => {
    if (adCooldown <=0) return
    const t = setTimeout(()=> setAdCooldown(c=>c-1), 1000)
    return ()=> clearTimeout(t)
  }, [adCooldown])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(()=> setToast(null), 2200)
  }

  const addCoins = (amount, reason) => {
    setBalance(b=> b+amount)
    setXp(x=> {
      const nx = x + Math.floor(amount/10)
      if (nx >= 1000) { setLevel(l=> l+1); return nx-1000 }
      return nx
    })
    hapticSuccess()
    showToast(`+${amount} Coins ${reason? '• '+reason:''}`)
  }

  const handleWatchAd = async () => {
    if (adCooldown>0) return showToast(`Wait ${adCooldown}s`)
    if (adsToday >= adsLimit) return showToast('Daily limit reached')
    if (isAdLoading) return
    setIsAdLoading(true)
    haptic('medium')
    try {
      await showRewardedAd(AD_ZONE_ID)
      addCoins(COIN_PER_AD, 'Ad Reward')
      setAdsToday(a=>a+1)
      setAdCooldown(15) // 15s cooldown anti-abuse
      // update task progress
      setTasks(ts=> ts.map(t=> t.id===3 ? {...t, progress: Math.min((t.progress||0)+1, t.total)} : t))
    } catch (e) {
      showToast('Ad not ready, try again')
    } finally {
      setIsAdLoading(false)
    }
  }

  const handleCheckin = () => {
    const today = new Date().toDateString()
    if (lastCheckin === today) return showToast('Already checked in today')
    const nextStreak = lastCheckin ? streak+1 : 1
    const reward = DAILY_REWARDS[Math.min(nextStreak-1, DAILY_REWARDS.length-1)]
    setStreak(nextStreak)
    setLastCheckin(today)
    addCoins(reward, `Day ${nextStreak}`)
  }

  const handleTask = (task) => {
    if (task.done) return
    if (task.link) window.open(task.link, '_blank')
    // mark done after small delay to simulate verification
    setTimeout(()=>{
      setTasks(ts=> ts.map(t=> t.id===task.id ? {...t, done:true} : t))
      addCoins(task.reward, task.title)
    }, 600)
  }

  const handleSpin = () => {
    if (spinsLeft<=0) return showToast('No spins left - Watch Ad to earn spin')
    haptic('heavy')
    const rewards = [20,50,100,200,500,10,30,150]
    const idx = Math.floor(Math.random()*rewards.length)
    const reward = rewards[idx]
    const extraDeg = 1800 + idx*45 + Math.random()*30
    setSpinDeg(d=> d+ extraDeg)
    setSpinsLeft(s=> s-1)
    setTimeout(()=> addCoins(reward, 'Spin Win'), 3100)
  }

  const handleWithdraw = () => {
    if (!withdrawAcc.trim()) return showToast('Enter account number')
    if (balance < WITHDRAW_MIN) return showToast(`Minimum ${WITHDRAW_MIN} coins needed`)
    const amt = Math.floor(balance)
    setWithdraws(w=> [{ id:Date.now(), amount: amt, method: withdrawMethod, status:'Pending', date: new Date().toISOString().slice(0,10)}, ...w])
    setBalance(0)
    setShowWithdraw(false)
    setWithdrawAcc('')
    showToast('Withdraw request submitted!')
  }

  const progressPct = Math.min((xp/1000)*100, 100)
  const usdValue = (balance/1000)*RATE_USD_PER_1000
  const todayStr = new Date().toDateString()
  const canCheckin = lastCheckin !== todayStr

  return (
    <>
      <Header user={user} balance={balance} level={level} />

      <div className="content">
        {tab==='home' && (
          <>
            <div className="hero">
              <div style={{display:'flex', alignItems:'center', gap:14}}>
                <div className="coin-icon">🪙</div>
                <div>
                  <div className="hero-balance">{balance.toLocaleString()} <span>COINS</span></div>
                  <div className="usd">≈ ${usdValue.toFixed(2)} USD • Level {level}</div>
                </div>
              </div>
              <div className="progress-wrap">
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#8B92B8', marginBottom:6}}>
                  <span>Level {level}</span><span>{xp}/1000 XP</span><span>Level {level+1}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${progressPct}%`}}></div></div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-val">🎬 {adsToday}/{adsLimit}</div>
                <div className="stat-label">Ads Today</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{color:'#00E5CC'}}>{spinsLeft} left</div>
                <div className="stat-label">Spins</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">🔥 {streak} days</div>
                <div className="stat-label">Streak</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Daily Check-in</div>
                  <div className="card-subtitle">Come back every day for bonus</div>
                </div>
                <button className="btn-secondary" onClick={handleCheckin} disabled={!canCheckin} style={{opacity: canCheckin?1:0.5}}>
                  {canCheckin ? `Claim Day ${Math.min(streak+1,7)}` : 'Done ✓'}
                </button>
              </div>
              <div className="checkin-grid">
                {DAILY_REWARDS.map((r,i)=> {
                  const d = i+1
                  const isClaimed = i < streak
                  const isNext = d === streak+1 && canCheckin
                  return (
                    <div key={i} className={`day-card ${isNext?'active':''} ${isClaimed?'claimed':''}`}>
                      <div className="day-num">Day {d}</div>
                      <div style={{fontSize:16, margin:'4px 0'}}>{isClaimed?'✅': isNext?'🎁':'🪙'}</div>
                      <div className="day-reward">+{r}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card" style={{background:'linear-gradient(135deg,#1A2040,#2A1F5A)', borderColor:'#3A2E7A'}}>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:14}}>
                <div style={{width:48,height:48, borderRadius:14, background:'linear-gradient(135deg,#FFB800,#FF6B00)', display:'grid', placeItems:'center', fontSize:22}}>▶️</div>
                <div>
                  <div style={{fontWeight:800, fontSize:16}}>Watch Ad & Earn</div>
                  <div style={{fontSize:13, color:'#B8BDD8'}}>{COIN_PER_AD} Coins per ad • {adsLimit-adsToday} left today</div>
                </div>
              </div>
              <button className="btn-primary" onClick={handleWatchAd} disabled={isAdLoading || adCooldown>0}>
                {isAdLoading ? 'Loading Ad...' : adCooldown>0 ? `Wait ${adCooldown}s` : `🎬 Watch Ad +${COIN_PER_AD}`}
              </button>
              <div className="cooldown">Ads by Monitag • Anti-fraud protected • 15s cooldown</div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Leaderboard</span>
                <span className="card-subtitle" style={{color:'#6C5CFF', cursor:'pointer'}} onClick={()=>setTab('friends')}>View all →</span>
              </div>
              {leaderboard.slice(0,4).map((u,i)=>(
                <div key={i} className="leader-row" style={u.isYou?{borderColor:'#6C5CFF', background:'rgba(108,92,255,0.1)'}:{}}>
                  <div className={`rank ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-other'}`}>{i+1}</div>
                  <div style={{width:36,height:36, borderRadius:'50%', background: u.isYou?'linear-gradient(135deg,#6C5CFF,#00E5CC)':'#242E5A', display:'grid', placeItems:'center', fontWeight:700, fontSize:12}}>{u.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:13}}>{u.name} {u.isYou && '(You)'}</div>
                    <div style={{fontSize:11, color:'#8B92B8'}}>{u.coins.toLocaleString()} coins</div>
                  </div>
                  <div style={{fontWeight:800, color:'#FFB800'}}>🪙 {u.coins.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==='tasks' && (
          <>
            <div style={{padding:'16px 16px 8px'}}>
              <h2 style={{fontSize:22, fontWeight:800}}>Tasks</h2>
              <p style={{color:'#8B92B8', fontSize:13, marginTop:4}}>Complete tasks to earn coins instantly</p>
            </div>
            <div className="card">
              <div className="card-title" style={{marginBottom:12}}>🔥 Daily Tasks</div>
              {tasks.map(t=> (
                <div key={t.id} className="task-item" onClick={()=>handleTask(t)} style={{opacity: t.done?0.6:1}}>
                  <div className="task-icon" style={{background: t.color}}>{t.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:14}}>{t.title}</div>
                    <div style={{fontSize:12, color:'#8B92B8'}}>
                      {t.total ? `${t.progress||0}/${t.total} completed` : t.done ? 'Completed ✓' : 'Tap to complete'}
                    </div>
                  </div>
                  <div className="task-reward">{t.done ? '✓' : `+${t.reward}`}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{background:'linear-gradient(135deg,#0F2A1F,#11162A)', borderColor:'rgba(0,214,143,0.2)'}}>
              <div style={{fontWeight:800}}>💎 Premium Tasks</div>
              <div style={{fontSize:13, color:'#8B92B8', margin:'6px 0 12px'}}>High reward tasks updated daily</div>
              <div className="task-item" onClick={()=>showToast('Coming soon!')}>
                <div className="task-icon" style={{background:'#FF3B5C'}}>🎮</div>
                <div style={{flex:1}}><div style={{fontWeight:700}}>Play Game 5 min</div><div style={{fontSize:12,color:'#8B92B8'}}>Earn extra bonus</div></div>
                <div className="task-reward">+1000</div>
              </div>
            </div>
          </>
        )}

        {tab==='spin' && (
          <div style={{padding:'16px', textAlign:'center'}}>
            <h2 style={{fontSize:22, fontWeight:800}}>Lucky Spin</h2>
            <p style={{color:'#8B92B8', fontSize:13}}>Spin & win up to 500 coins</p>

            <div style={{position:'relative', margin:'20px 0'}}>
              <div className="spin-pointer"></div>
              <div className="spin-wheel" style={{transform:`rotate(${spinDeg}deg)`}}>
                <div className="spin-center" onClick={handleSpin}>SPIN</div>
              </div>
            </div>

            <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:16}}>
              <div className="stat-card" style={{minWidth:110}}><div className="stat-val">{spinsLeft}</div><div className="stat-label">Spins Left</div></div>
              <div className="stat-card" style={{minWidth:110}}><div className="stat-val" style={{color:'#FFB800'}}>WIN 500</div><div className="stat-label">Max Reward</div></div>
            </div>

            <button className="btn-primary" onClick={handleSpin} disabled={spinsLeft<=0}>
              {spinsLeft>0 ? `🎡 Spin Now (${spinsLeft} left)` : 'No Spins Left'}
            </button>
            {spinsLeft<=0 && (
              <button className="btn-secondary" style={{width:'100%', marginTop:10, justifyContent:'center'}} onClick={handleWatchAd}>
                🎬 Watch Ad to Get +1 Spin
              </button>
            )}
            <div className="card" style={{marginTop:16, textAlign:'left'}}>
              <div className="card-title">How to get spins?</div>
              <div style={{fontSize:13, color:'#8B92B8', lineHeight:1.6, marginTop:8}}>
                • Daily free 3 spins<br/>
                • Watch 3 ads = +1 spin<br/>
                • Invite friend = +2 spins
              </div>
            </div>
          </div>
        )}

        {tab==='friends' && (
          <>
            <div className="refer-card">
              <div style={{fontWeight:800, fontSize:18, position:'relative', zIndex:1}}>Invite Friends & Earn</div>
              <div style={{fontSize:13, opacity:0.9, marginTop:4, position:'relative', zIndex:1}}>Get 15% of friends earnings forever + 500 coins per friend</div>
              <div className="invite-link">
                <span>t.me/yourbot?start={user?.id || 'demo'}</span>
                <button onClick={()=>{
                    const link = `https://t.me/yourbot?start=${user?.id||'demo'}`
                    navigator.clipboard?.writeText(link)
                    showToast('Link copied!')
                    haptic('light')
                  }} style={{background:'white', color:'#6C5CFF', border:'none', padding:'6px 12px', borderRadius:8, fontWeight:700, cursor:'pointer'}}>Copy</button>
              </div>
              <button className="btn-secondary" style={{width:'100%', marginTop:12, background:'white', color:'#6C5CFF', border:'none', justifyContent:'center', fontWeight:800, position:'relative', zIndex:1}} onClick={()=>{
                const link = `https://t.me/yourbot?start=${user?.id||'demo'}`
                const text = `Join EarnPulse & earn money! ${link}`
                window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,'_blank')
              }}>
                📤 Invite Friend
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><div className="stat-val">{referrals}</div><div className="stat-label">Friends</div></div>
              <div className="stat-card"><div className="stat-val" style={{color:'#00D68F'}}>{referrals*500}</div><div className="stat-label">Earned</div></div>
              <div className="stat-card"><div className="stat-val">15%</div><div className="stat-label">Commission</div></div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">My Referrals ({referrals})</span><span className="card-subtitle">+500 each</span></div>
              {[1,2,3].map(i=>(
                <div key={i} className="task-item" style={{cursor:'default'}}>
                  <div style={{width:36,height:36, borderRadius:'50%', background:'#242E5A', display:'grid', placeItems:'center', fontWeight:700}}>U{i}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700, fontSize:14}}>User {i}***{i+3}</div><div style={{fontSize:11, color:'#00D68F'}}>+500 coins • Active</div></div>
                  <div style={{color:'#FFB800', fontWeight:700}}>🪙 500</div>
                </div>
              ))}
              <button className="btn-ghost btn-secondary" style={{width:'100%', justifyContent:'center', marginTop:8}} onClick={()=>showToast('Full list in backend')}>View All Referrals</button>
            </div>
          </>
        )}

        {tab==='wallet' && (
          <>
            <div style={{padding:'16px 16px 0'}}>
              <h2 style={{fontSize:22, fontWeight:800}}>Wallet</h2>
              <p style={{color:'#8B92B8', fontSize:13}}>Withdraw your earnings instantly</p>
            </div>
            <div className="hero" style={{background:'linear-gradient(135deg,#11162A,#1A2040)'}}>
              <div style={{fontSize:12, color:'#8B92B8', letterSpacing:1, fontWeight:700}}>TOTAL BALANCE</div>
              <div className="hero-balance" style={{marginTop:6}}>{balance.toLocaleString()} <span>COINS</span></div>
              <div style={{color:'#00D68F', fontSize:14, fontWeight:700, marginTop:4}}>≈ ${usdValue.toFixed(2)} USD</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16}}>
                <button className="btn-primary" onClick={()=>setShowWithdraw(true)} style={{padding:'12px'}}>💸 Withdraw</button>
                <button className="btn-secondary" style={{justifyContent:'center'}} onClick={()=>showToast('History below')}>📄 History</button>
              </div>
              <div style={{fontSize:11, color:'#8B92B8', marginTop:10, textAlign:'center'}}>Min withdraw: {WITHDRAW_MIN.toLocaleString()} coins (≈ ${(WITHDRAW_MIN/1000*RATE_USD_PER_1000).toFixed(2)})</div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, margin:'0 16px'}}>
              {[
                {name:'bKash', icon:'💗', min:'5000'},
                {name:'Nagad', icon:'🧡', min:'5000'},
                {name:'USDT', icon:'💚', min:'10000'},
              ].map(m=>(
                <div key={m.name} className="stat-card" onClick={()=>{setWithdrawMethod(m.name); setShowWithdraw(true)}} style={{cursor:'pointer'}}>
                  <div style={{fontSize:20}}>{m.icon}</div>
                  <div style={{fontWeight:700, fontSize:13, marginTop:4}}>{m.name}</div>
                  <div style={{fontSize:11, color:'#8B92B8'}}>Min {m.min}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title" style={{marginBottom:12}}>Withdraw History</div>
              {withdraws.length===0 ? <div style={{color:'#8B92B8', textAlign:'center', padding:20}}>No withdraws yet</div> :
                withdraws.map(w=>(
                  <div key={w.id} className="task-item" style={{cursor:'default'}}>
                    <div className="task-icon" style={{background: w.status==='Paid'?'#00D68F':'#FFB800', fontSize:16}}>{w.status==='Paid'?'✓':'⏳'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700}}>{w.amount.toLocaleString()} Coins • {w.method}</div>
                      <div style={{fontSize:12, color:'#8B92B8'}}>{w.date} • <span style={{color: w.status==='Paid'?'#00D68F':'#FFB800'}}>{w.status}</span></div>
                    </div>
                    <div style={{fontWeight:700, color:'#8B92B8'}}>${(w.amount/1000*RATE_USD_PER_1000).toFixed(2)}</div>
                  </div>
                ))
              }
            </div>

            <div className="card" style={{background:'rgba(255,184,0,0.08)', borderColor:'rgba(255,184,0,0.2)'}}>
              <div style={{fontWeight:700, fontSize:13}}>⚠️ Withdraw Rules</div>
              <div style={{fontSize:12, color:'#8B92B8', lineHeight:1.6, marginTop:6}}>
                • Payment within 24 hours<br/>
                • Fake referrals will be banned<br/>
                • One account per device
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active={tab} onChange={(id)=>{haptic('light'); setTab(id)}} />

      {toast && <div className="toast">✨ {toast}</div>}

      {showWithdraw && (
        <div className="modal-overlay" onClick={()=>setShowWithdraw(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontWeight:800, fontSize:18}}>Withdraw</h3>
            <p style={{color:'#8B92B8', fontSize:13, marginTop:4}}>Balance: {balance.toLocaleString()} coins (${usdValue.toFixed(2)})</p>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:16}}>
              {['bKash','Nagad','USDT'].map(m=>(
                <button key={m} onClick={()=>setWithdrawMethod(m)} className="btn-secondary" style={{justifyContent:'center', background: withdrawMethod===m? 'linear-gradient(135deg,#6C5CFF,#9B6DFF)':'var(--card)', color: withdrawMethod===m?'white':'#8B92B8', borderColor: withdrawMethod===m?'transparent':'var(--border)'}}>{m}</button>
              ))}
            </div>

            <div style={{marginTop:14}}>
              <div style={{fontSize:12, color:'#8B92B8', marginBottom:6}}>{withdrawMethod} Number / Address</div>
              <input className="input" placeholder={withdrawMethod==='USDT' ? 'TRC20 Address' : '01XXXXXXXXX'} value={withdrawAcc} onChange={e=>setWithdrawAcc(e.target.value)} />
            </div>
            <div style={{marginTop:10, fontSize:12, color: balance>=WITHDRAW_MIN?'#00D68F':'#FF3B5C'}}>
              {balance>=WITHDRAW_MIN ? `✓ Eligible to withdraw ${balance.toLocaleString()} coins` : `Need ${ (WITHDRAW_MIN-balance).toLocaleString()} more coins (Min ${WITHDRAW_MIN})`}
            </div>
            <button className="btn-primary" style={{marginTop:14}} onClick={handleWithdraw} disabled={balance < WITHDRAW_MIN}>Confirm Withdraw</button>
            <button className="btn-secondary" style={{width:'100%', justifyContent:'center', marginTop:8, background:'transparent'}} onClick={()=>setShowWithdraw(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
