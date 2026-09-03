import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import { useTelegram } from './hooks/useTelegram.js'
import { showRewardedAd, showRewardedPopup, showInAppInterstitial } from './lib/ads.js'
import { db, userRef, ref, get, set, update, onValue, off } from './lib/firebase.js'
import {
  CoinSVG, CoinSmall, CoinTiny,
  IconVideo, IconFlame, IconGift, IconCheck, IconClock, IconTrophy, IconZap, IconMegaphone, IconTwitterX, IconGamepad, IconShield, IconWithdraw, IconCopy, IconSend, IconStar, IconPlay, IconSpin as IconSpinSvg
} from './components/Icons.jsx'

// --- Config ---
const AD_ZONE_ID = '11718341'
const COIN_PER_AD = 50
const DAILY_REWARDS = [50,100,150,250,400,600,1000]
const WITHDRAW_MIN = 5000
const RATE_USD_PER_1000 = 0.12

function loadState() {
  try { return JSON.parse(localStorage.getItem('earnapp_state') || 'null') } catch { return null }
}
function saveState(s) { localStorage.setItem('earnapp_state', JSON.stringify(s)) }

export default function App() {
  const { user, haptic, hapticSuccess } = useTelegram()
  const [tab, setTab] = useState('home')
  const [toast, setToast] = useState(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawMethod, setWithdrawMethod] = useState('bKash')
  const [withdrawAcc, setWithdrawAcc] = useState('')

  const [balance, setBalance] = useState(() => loadState()?.balance ?? 0)
  const [level, setLevel] = useState(() => loadState()?.level ?? 1)
  const [xp, setXp] = useState(() => loadState()?.xp ?? 0)
  const [streak, setStreak] = useState(() => loadState()?.streak ?? 0)
  const [lastCheckin, setLastCheckin] = useState(() => loadState()?.lastCheckin ?? null)
  const [adsToday, setAdsToday] = useState(() => loadState()?.adsToday ?? 0)
  const [adsLimit] = useState(30)
  const [adCooldown, setAdCooldown] = useState(0)
  const [isAdLoading, setIsAdLoading] = useState(false)
  const [spinDeg, setSpinDeg] = useState(0)
  const [spinsLeft, setSpinsLeft] = useState(() => loadState()?.spinsLeft ?? 1)
  const [miningBoost, setMiningBoost] = useState(() => loadState()?.miningBoost ?? 1)
  const [miningClaimable, setMiningClaimable] = useState(0)
  const [fbLoaded, setFbLoaded] = useState(false)
  const [fbStatus, setFbStatus] = useState('connecting')

  const [tasks, setTasks] = useState(() => loadState()?.tasks ?? [
    { id:1, title:'Join Telegram Channel', reward:200, done:false, color:'#6C5CFF', link:'https://t.me/', iconType:'megaphone' },
    { id:2, title:'Follow X (Twitter)', reward:150, done:false, color:'#1DA1F2', link:'https://x.com/', iconType:'twitter' },
    { id:3, title:'Watch 5 Ads Today', reward:300, done:false, progress: 0, total:5, color:'#00E5CC', iconType:'video' },
    { id:4, title:'Invite 3 Friends', reward:500, done:false, progress:0, total:3, color:'#FFB800', iconType:'gift' },
    { id:5, title:'Daily Check-in 7 Days', reward:800, done:false, color:'#FF3B5C', iconType:'flame' },
  ])
  const [referrals, setReferrals] = useState(() => loadState()?.referrals ?? 0)
  const [withdraws, setWithdraws] = useState(() => loadState()?.withdraws ?? [])
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    saveState({ balance, level, xp, streak, lastCheckin, adsToday, spinsLeft, tasks, withdraws, miningBoost, referrals })
  }, [balance, level, xp, streak, lastCheckin, adsToday, spinsLeft, tasks, withdraws, miningBoost, referrals])

  // Firebase Realtime DB - Direct Telegram username system, all data save in real time
  useEffect(() => {
    if (!user?.id) return
    const uref = userRef(user.id)
    setFbStatus('loading')
    get(uref).then(snap => {
      if (snap.exists()) {
        const d = snap.val()
        if (d.balance !== undefined) setBalance(d.balance)
        if (d.level !== undefined) setLevel(d.level)
        if (d.xp !== undefined) setXp(d.xp)
        if (d.streak !== undefined) setStreak(d.streak)
        if (d.lastCheckin !== undefined) setLastCheckin(d.lastCheckin)
        if (d.adsToday !== undefined) setAdsToday(d.adsToday)
        if (d.spinsLeft !== undefined) setSpinsLeft(d.spinsLeft)
        if (d.miningBoost !== undefined) setMiningBoost(d.miningBoost)
        if (d.tasks) setTasks(d.tasks)
        if (d.withdraws) setWithdraws(d.withdraws)
        if (d.referrals !== undefined) setReferrals(d.referrals)
        setFbStatus('connected')
        // showToast handled elsewhere to avoid spam
      } else {
        // First time user - create in Realtime DB with direct Telegram username
        set(uref, {
          id: user.id,
          username: user.username || '',
          first_name: user.first_name || '',
          photo_url: user.photo_url || '',
          balance, level, xp, streak, lastCheckin, adsToday, spinsLeft, miningBoost, tasks, withdraws, referrals,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).then(()=> setFbStatus('connected')).catch(()=> setFbStatus('error'))
      }
      setFbLoaded(true)
    }).catch(err => {
      console.warn('Firebase load failed', err)
      setFbStatus('error')
      setFbLoaded(true)
    })
  }, [user?.id])

  // Firebase auto-save on every change (real time)
  useEffect(() => {
    if (!fbLoaded || !user?.id) return
    const uref = userRef(user.id)
    const t = setTimeout(() => {
      update(uref, {
        balance, level, xp, streak, lastCheckin, adsToday, spinsLeft, miningBoost, tasks, withdraws, referrals,
        username: user.username || '',
        first_name: user.first_name || '',
        photo_url: user.photo_url || '',
        updatedAt: new Date().toISOString()
      }).then(()=> setFbStatus('connected')).catch(err => {
        console.warn('Firebase save failed', err)
        setFbStatus('error')
      })
    }, 600)
    return () => clearTimeout(t)
  }, [balance, level, xp, streak, lastCheckin, adsToday, spinsLeft, miningBoost, tasks, withdraws, referrals, fbLoaded, user?.id, user?.username])

  useEffect(() => {
    if (adCooldown <=0) return
    const t = setTimeout(()=> setAdCooldown(c=>c-1), 1000)
    return ()=> clearTimeout(t)
  }, [adCooldown])

  // mining accrual simulation
  useEffect(() => {
    const t = setInterval(()=> setMiningClaimable(c=> Math.min(c+1, 500)), 3000)
    return ()=> clearInterval(t)
  }, [])

  // In-App Interstitial - Best Fit: Auto passive, no reward, timeframe 2 ads per 6min
  useEffect(() => {
    const timer = setTimeout(() => {
      showInAppInterstitial(AD_ZONE_ID, {
        frequency: 2,
        capping: 0.1,
        interval: 30,
        timeout: 5,
        everyPage: false
      }).catch(()=>{})
    }, 5000) // 5s delay before first auto ad
    return () => clearTimeout(timer)
  }, [])

  // Real Leaderboard - no dummy, from Firebase Realtime DB
  useEffect(() => {
    const lbRef = ref(db, 'takaboom/users')
    const unsub = onValue(lbRef, (snap) => {
      if (!snap.exists()) { setLeaderboard([]); return }
      const users = Object.values(snap.val())
      const sorted = users
        .filter(u => u.id)
        .sort((a,b) => (b.balance||0) - (a.balance||0))
        .slice(0, 20)
        .map(u => ({
          name: u.first_name || u.username || 'User',
          username: u.username || '',
          coins: u.balance || 0,
          avatar: (u.first_name?.[0] || u.username?.[0] || 'U').toUpperCase(),
          id: u.id,
          isYou: String(u.id) === String(user?.id)
        }))
      // Ensure current user visible even if not top 20
      if (user?.id && !sorted.find(x => String(x.id)===String(user.id))) {
        sorted.push({
          name: user.first_name || 'You',
          username: user.username || '',
          coins: balance,
          avatar: (user.first_name?.[0] || 'Y').toUpperCase(),
          id: user.id,
          isYou: true
        })
      }
      setLeaderboard(sorted)
    })
    return () => off(lbRef)
  }, [user?.id, balance])

  const showToast = (msg) => { setToast(msg); setTimeout(()=> setToast(null), 2200) }

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
      setAdCooldown(15)
      setTasks(ts=> ts.map(t=> t.id===3 ? {...t, progress: Math.min((t.progress||0)+1, t.total)} : t))
      if ((adsToday+1) % 3 === 0) setSpinsLeft(s=> s+1)
    } catch (e) {
      console.error('Watch Ad failed', e)
      const msg = e?.message?.includes('not loaded') ? 'Ad blocked: Add takaboom.vercel.app in Monetag dashboard > Sites, or disable ad blocker' : 'Ad not ready, try again in 10s'
      showToast(msg)
    }
    finally { setIsAdLoading(false) }
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

  const handlePremiumPopup = async (reward, title) => {
    haptic('medium')
    try {
      await showRewardedPopup(AD_ZONE_ID)
      addCoins(reward, title)
    } catch (e) {
      console.error('Popup failed', e)
      showToast(e?.message?.includes('not loaded') ? 'Ad blocked: Add takaboom.vercel.app in Monetag dashboard' : 'Ad not ready, try again')
    }
  }

  const handleMiningClaim = () => {
    if (miningClaimable < 10) return showToast('Mining… come back later')
    addCoins(miningClaimable, 'Mining Claim')
    setMiningClaimable(0)
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

  const taskIcon = (type, color) => {
    const bg = { background: color, width:44, height:44, borderRadius:12, display:'grid', placeItems:'center', flexShrink:0 }
    if (type==='megaphone') return <div style={bg}><IconMegaphone size={20} /></div>
    if (type==='twitter') return <div style={bg}><IconTwitterX size={18} /></div>
    if (type==='video') return <div style={bg}><IconVideo size={18} /></div>
    if (type==='gift') return <div style={bg}><IconGift size={18} /></div>
    if (type==='flame') return <div style={bg}><IconFlame size={18} /></div>
    return <div style={bg}><IconZap size={18} /></div>
  }

  return (
    <>
      <Header user={user} balance={balance} level={level} />

      <div className="content">
        {tab==='home' && (
          <>
            <div className="hero">
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                <div style={{background:'linear-gradient(135deg,#FFB800,#FF6B00)', color:'#000', fontWeight:900, fontSize:11, padding:'4px 10px', borderRadius:999, display:'flex', alignItems:'center', gap:5, letterSpacing:0.5}}><IconZap size={12} /> TAKA BOOM</div>
                <span style={{fontSize:10, color:'#8B92B8', fontWeight:700, letterSpacing:1}}>WORLD BEST EARNING APP</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:14}}>
                <div className="coin-icon" style={{background:'none', boxShadow:'none', borderRadius:0}}><CoinSVG size={62} /></div>
                <div>
                  <div className="hero-balance">{balance.toLocaleString()} <span>COINS</span></div>
                  <div className="usd"><CoinTiny size={12} /> ≈ ${usdValue.toFixed(2)} USD • Level {level}</div>
                </div>
              </div>
              <div className="progress-wrap">
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#8B92B8', marginBottom:6}}>
                  <span>Level {level}</span><span>{xp}/1000 XP</span><span>Level {level+1}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${progressPct}%`}}></div></div>
              </div>
            </div>

            {/* Mining World Best Feature */}
            <div className="card" style={{background:'linear-gradient(135deg,#0F1F3A,#1A2040)', borderColor:'#2A3A6A', position:'relative', overflow:'hidden'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{width:42,height:42, borderRadius:12, background:'linear-gradient(135deg,#00E5CC,#6C5CFF)', display:'grid', placeItems:'center'}}><IconZap size={20} /></div>
                  <div>
                    <div style={{fontWeight:800, fontSize:14, display:'flex', alignItems:'center', gap:6}}>Mining Boost <span style={{background:'rgba(0,229,204,0.15)', color:'#00E5CC', fontSize:10, padding:'2px 6px', borderRadius:6, border:'1px solid rgba(0,229,204,0.3)'}}>x{miningBoost}</span></div>
                    <div style={{fontSize:11, color:'#8B92B8'}}>Auto mining every 3 sec</div>
                  </div>
                </div>
                <button onClick={()=>{ if(balance>=1000){ setBalance(b=>b-1000); setMiningBoost(b=>b+1); showToast('Boost upgraded to x'+(miningBoost+1)) } else showToast('Need 1000 coins')}} className="btn-secondary" style={{padding:'8px 12px', fontSize:12}}><IconZap size={14} /> Boost</button>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:12, marginTop:14, background:'rgba(0,0,0,0.25)', borderRadius:12, padding:12, border:'1px solid rgba(255,255,255,0.06)'}}>
                <CoinSVG size={36} />
                <div style={{flex:1}}>
                  <div style={{fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:6}}>{miningClaimable} <span style={{fontWeight:600, fontSize:12, color:'#8B92B8'}}>coins ready</span></div>
                  <div style={{height:6, background:'rgba(255,255,255,0.08)', borderRadius:999, overflow:'hidden', marginTop:6}}><div style={{width: `${Math.min(miningClaimable/500*100,100)}%`, height:'100%', background:'linear-gradient(90deg,#FFB800,#FF8C00)', transition:'width 0.5s'}}></div></div>
                </div>
                <button onClick={handleMiningClaim} className="btn-primary" style={{width:'auto', padding:'10px 16px', fontSize:13}}>Claim</button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-val" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6}}><IconVideo size={16} /> {adsToday}/{adsLimit}</div>
                <div className="stat-label">Ads Today</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{color:'#00E5CC', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}><IconSpinSvg size={16} /> {spinsLeft} left</div>
                <div className="stat-label">Spins</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6}}><IconFlame size={16} /> {streak} days</div>
                <div className="stat-label">Streak</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title" style={{display:'flex', alignItems:'center', gap:6}}><IconStar size={14} /> Daily Check-in</div>
                  <div className="card-subtitle">Come back every day for bonus</div>
                </div>
                <button className="btn-secondary" onClick={handleCheckin} disabled={!canCheckin} style={{opacity: canCheckin?1:0.5, gap:6}}>
                  {canCheckin ? <><IconGift size={14} /> Claim Day {Math.min(streak+1,7)}</> : <><IconCheck size={14} /> Done</>}
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
                      <div style={{margin:'6px 0', display:'grid', placeItems:'center'}}>
                        {isClaimed ? <IconCheck size={18} /> : isNext ? <IconGift size={18} /> : <CoinTiny size={18} />}
                      </div>
                      <div className="day-reward" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:2}}><CoinTiny size={10} />+{r}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card" style={{background:'linear-gradient(135deg,#1A2040,#2A1F5A)', borderColor:'#3A2E7A'}}>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:14}}>
                <div style={{width:48,height:48, borderRadius:14, background:'linear-gradient(135deg,#FFB800,#FF6B00)', display:'grid', placeItems:'center'}}><IconPlay size={22} /></div>
                <div>
                  <div style={{fontWeight:800, fontSize:16, display:'flex', alignItems:'center', gap:6}}>Watch Ad & Earn <CoinSmall size={14} /> </div>
                  <div style={{fontSize:13, color:'#B8BDD8'}}>{COIN_PER_AD} Coins per ad • {adsLimit-adsToday} left today</div>
                </div>
              </div>
              <button className="btn-primary" onClick={handleWatchAd} disabled={isAdLoading || adCooldown>0}>
                {isAdLoading ? <><IconClock size={16} /> Loading Ad...</> : adCooldown>0 ? <><IconClock size={16} /> Wait {adCooldown}s</> : <><IconVideo size={18} /> Watch Ad <CoinSmall size={16} /> +{COIN_PER_AD}</>}
              </button>
              <div className="cooldown" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:10}}><IconShield size={12} /> Ads by Monitag • Anti-fraud protected • 15s cooldown</div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{display:'flex', alignItems:'center', gap:6}}><IconTrophy size={16} /> Leaderboard</span>
                <span className="card-subtitle" style={{color:'#6C5CFF', cursor:'pointer'}} onClick={()=>setTab('friends')}>View all →</span>
              </div>
              {leaderboard.slice(0,4).map((u,i)=>(
                <div key={i} className="leader-row" style={u.isYou?{borderColor:'#6C5CFF', background:'rgba(108,92,255,0.1)'}:{}}>
                  <div className={`rank ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-other'}`}>{i+1}</div>
                  <div style={{width:36,height:36, borderRadius:'50%', background: u.isYou?'linear-gradient(135deg,#6C5CFF,#00E5CC)':'#242E5A', display:'grid', placeItems:'center', fontWeight:700, fontSize:12}}>{u.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:13}}>{u.name} {u.isYou && '(You)'}</div>
                    <div style={{fontSize:11, color:'#8B92B8', display:'flex', alignItems:'center', gap:4}}><CoinTiny size={10} />{u.isYou ? balance.toLocaleString() : u.coins.toLocaleString()} coins</div>
                  </div>
                  <div style={{fontWeight:800, color:'#FFB800', display:'flex', alignItems:'center', gap:4}}><CoinSmall size={14} /> {u.isYou ? balance.toLocaleString() : u.coins.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==='tasks' && (
          <>
            <div style={{padding:'16px 16px 8px'}}>
              <h2 style={{fontSize:22, fontWeight:800, display:'flex', alignItems:'center', gap:8}}><IconStar size={20} /> Tasks</h2>
              <p style={{color:'#8B92B8', fontSize:13, marginTop:4}}>Complete tasks to earn coins instantly</p>
            </div>
            <div className="card">
              <div className="card-title" style={{marginBottom:12, display:'flex', alignItems:'center', gap:6}}><IconFlame size={16} /> Daily Tasks</div>
              {tasks.map(t=> (
                <div key={t.id} className="task-item" onClick={()=>handleTask(t)} style={{opacity: t.done?0.6:1}}>
                  {taskIcon(t.iconType, t.color)}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:14}}>{t.title}</div>
                    <div style={{fontSize:12, color:'#8B92B8'}}>
                      {t.total ? `${t.progress||0}/${t.total} completed` : t.done ? 'Completed' : 'Tap to complete'}
                    </div>
                  </div>
                  <div className="task-reward" style={{display:'flex', alignItems:'center', gap:4}}>
                    {t.done ? <IconCheck size={14} /> : <><CoinTiny size={12} /> +{t.reward}</>}
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{background:'linear-gradient(135deg,#0F2A1F,#11162A)', borderColor:'rgba(0,214,143,0.2)'}}>
              <div style={{fontWeight:800, display:'flex', alignItems:'center', gap:6}}><CoinSmall size={16} /> Premium Offerwall</div>
              <div style={{fontSize:13, color:'#8B92B8', margin:'6px 0 12px'}}>High reward tasks updated daily • World Best</div>
              <div className="task-item" onClick={()=>handlePremiumPopup(1000, 'Premium Game')}>
                <div style={{width:44,height:44, borderRadius:12, background:'#FF3B5C', display:'grid', placeItems:'center'}}><IconGamepad size={20} /></div>
                <div style={{flex:1}}><div style={{fontWeight:700, display:'flex', alignItems:'center', gap:6}}>Play Game 5 min <span style={{background:'#FF3B5C', color:'white', fontSize:10, padding:'2px 6px', borderRadius:6}}>HOT • POPUP</span></div><div style={{fontSize:12,color:'#8B92B8'}}>Rewarded Popup • Direct offer • +1000</div></div>
                <div className="task-reward" style={{display:'flex', alignItems:'center', gap:4}}><CoinTiny size={12} /> +1000</div>
              </div>
              <div className="task-item" onClick={()=>handlePremiumPopup(1500, 'Survey')}>
                <div style={{width:44,height:44, borderRadius:12, background:'#6C5CFF', display:'grid', placeItems:'center'}}><IconMegaphone size={20} /></div>
                <div style={{flex:1}}><div style={{fontWeight:700, display:'flex', alignItems:'center', gap:6}}>Complete Survey <span style={{background:'#6C5CFF', color:'white', fontSize:10, padding:'2px 6px', borderRadius:6}}>POPUP</span></div><div style={{fontSize:12,color:'#8B92B8'}}>Rewarded Popup • 2 min • High payout</div></div>
                <div className="task-reward" style={{display:'flex', alignItems:'center', gap:4}}><CoinTiny size={12} /> +1500</div>
              </div>
            </div>
          </>
        )}

        {tab==='spin' && (
          <div style={{padding:'16px', textAlign:'center'}}>
            <h2 style={{fontSize:22, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}><IconTrophy size={20} /> Lucky Spin</h2>
            <p style={{color:'#8B92B8', fontSize:13}}>Spin & win up to <span style={{color:'#FFB800', fontWeight:800, display:'inline-flex', alignItems:'center', gap:4}}><CoinTiny size={12} /> 500 coins</span></p>

            <div style={{position:'relative', margin:'20px 0'}}>
              <div className="spin-pointer"></div>
              <div className="spin-wheel" style={{transform:`rotate(${spinDeg}deg)`}}>
                <div className="spin-center" onClick={handleSpin} style={{flexDirection:'column', gap:2}}>
                  <CoinTiny size={16} />
                  <span style={{fontSize:11, fontWeight:900}}>SPIN</span>
                </div>
              </div>
            </div>

            <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:16}}>
              <div className="stat-card" style={{minWidth:110}}><div className="stat-val" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6}}><IconSpinSvg size={16} /> {spinsLeft}</div><div className="stat-label">Spins Left</div></div>
              <div className="stat-card" style={{minWidth:110}}><div className="stat-val" style={{color:'#FFB800', display:'flex', alignItems:'center', justifyContent:'center', gap:4}}><CoinSmall size={14} /> WIN 500</div><div className="stat-label">Max Reward</div></div>
            </div>

            <button className="btn-primary" onClick={handleSpin} disabled={spinsLeft<=0}>
              {spinsLeft>0 ? <><IconSpinSvg size={18} /> Spin Now ({spinsLeft} left)</> : 'No Spins Left'}
            </button>
            {spinsLeft<=0 && (
              <button className="btn-secondary" style={{width:'100%', marginTop:10, justifyContent:'center'}} onClick={handleWatchAd}>
                <IconVideo size={16} /> Watch Ad to Get +1 Spin
              </button>
            )}
            <div className="card" style={{marginTop:16, textAlign:'left'}}>
              <div className="card-title" style={{display:'flex', alignItems:'center', gap:6}}><IconStar size={14} /> How to get spins?</div>
              <div style={{fontSize:13, color:'#8B92B8', lineHeight:1.8, marginTop:8}}>
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
              <div style={{fontWeight:800, fontSize:18, position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:8}}><IconGift size={20} /> Invite Friends & Earn</div>
              <div style={{fontSize:13, opacity:0.9, marginTop:4, position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:4}}>Get 15% forever + <CoinTiny size={12} /> 500 coins per friend</div>
              <div className="invite-link">
                <span>t.me/BoomTakaBd_bot?start={user?.id || 'demo'}</span>
                <button onClick={()=>{
                    const link = `https://t.me/BoomTakaBd_bot?start=${user?.id||'demo'}`
                    navigator.clipboard?.writeText(link)
                    showToast('Link copied!')
                    haptic('light')
                  }} style={{background:'white', color:'#6C5CFF', border:'none', padding:'6px 12px', borderRadius:8, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6}}><IconCopy size={14} /> Copy</button>
              </div>
              <button className="btn-secondary" style={{width:'100%', marginTop:12, background:'white', color:'#6C5CFF', border:'none', justifyContent:'center', fontWeight:800, position:'relative', zIndex:1}} onClick={()=>{
                const link = `https://t.me/BoomTakaBd_bot?start=${user?.id||'demo'}`
                const text = `Join TakaBoom & earn Taka! ${link}`
                window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,'_blank')
              }}>
                <IconSend size={14} /> Invite Friend
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><div className="stat-val">{referrals}</div><div className="stat-label">Friends</div></div>
              <div className="stat-card"><div className="stat-val" style={{color:'#00D68F', display:'flex', alignItems:'center', justifyContent:'center', gap:4}}><CoinSmall size={14} /> {referrals*500}</div><div className="stat-label">Earned</div></div>
              <div className="stat-card"><div className="stat-val">15%</div><div className="stat-label">Commission</div></div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title" style={{display:'flex', alignItems:'center', gap:6}}><IconGift size={14} /> My Referrals ({referrals})</span><span className="card-subtitle" style={{display:'flex', alignItems:'center', gap:4}}><CoinTiny size={10} />+500 each</span></div>
              {[1,2,3].map(i=>(
                <div key={i} className="task-item" style={{cursor:'default'}}>
                  <div style={{width:36,height:36, borderRadius:'50%', background:'#242E5A', display:'grid', placeItems:'center', fontWeight:700, fontSize:12}}>U{i}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700, fontSize:14}}>User {i}***{i+3}</div><div style={{fontSize:11, color:'#00D68F', display:'flex', alignItems:'center', gap:4}}><IconCheck size={10} /> <CoinTiny size={10} /> 500 coins • Active</div></div>
                  <div style={{color:'#FFB800', fontWeight:700, display:'flex', alignItems:'center', gap:4}}><CoinSmall size={14} /> 500</div>
                </div>
              ))}
              <button className="btn-ghost btn-secondary" style={{width:'100%', justifyContent:'center', marginTop:8}} onClick={()=>showToast('Full list in backend')}>View All Referrals</button>
            </div>
          </>
        )}

        {tab==='wallet' && (
          <>
            <div style={{padding:'16px 16px 0'}}>
              <h2 style={{fontSize:22, fontWeight:800, display:'flex', alignItems:'center', gap:8}}><IconWithdraw size={20} /> Wallet</h2>
              <p style={{color:'#8B92B8', fontSize:13}}>Withdraw your earnings instantly</p>
            </div>
            <div className="hero" style={{background:'linear-gradient(135deg,#11162A,#1A2040)'}}>
              <div style={{fontSize:12, color:'#8B92B8', letterSpacing:1, fontWeight:700, display:'flex', alignItems:'center', gap:6}}><IconShield size={12} /> TOTAL BALANCE</div>
              <div className="hero-balance" style={{marginTop:6, display:'flex', alignItems:'center', gap:8}}><CoinSVG size={36} /> {balance.toLocaleString()} <span>COINS</span></div>
              <div style={{color:'#00D68F', fontSize:14, fontWeight:700, marginTop:4, display:'flex', alignItems:'center', gap:6}}><CoinTiny size={12} />≈ ${usdValue.toFixed(2)} USD</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16}}>
                <button className="btn-primary" onClick={()=>setShowWithdraw(true)} style={{padding:'12px', gap:6}}><IconWithdraw size={16} /> Withdraw</button>
                <button className="btn-secondary" style={{justifyContent:'center', gap:6}} onClick={()=>showToast('History below')}><IconClock size={14} /> History</button>
              </div>
              <div style={{fontSize:11, color:'#8B92B8', marginTop:10, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:4}}><IconShield size={10} /> Min withdraw: {WITHDRAW_MIN.toLocaleString()} coins (≈ ${(WITHDRAW_MIN/1000*RATE_USD_PER_1000).toFixed(2)})</div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, margin:'0 16px'}}>
              {[
                {name:'bKash', color:'#E2136E', min:'5000'},
                {name:'Nagad', color:'#FF6B00', min:'5000'},
                {name:'USDT', color:'#00D68F', min:'10000'},
              ].map(m=>(
                <div key={m.name} className="stat-card" onClick={()=>{setWithdrawMethod(m.name); setShowWithdraw(true)}} style={{cursor:'pointer', borderColor: m.color+'40'}}>
                  <div style={{width:32,height:32, borderRadius:8, background:m.color, display:'grid', placeItems:'center', margin:'0 auto'}}><IconWithdraw size={16} /></div>
                  <div style={{fontWeight:700, fontSize:13, marginTop:6}}>{m.name}</div>
                  <div style={{fontSize:11, color:'#8B92B8', display:'flex', alignItems:'center', justifyContent:'center', gap:3}}><CoinTiny size={10} /> Min {m.min}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title" style={{marginBottom:12, display:'flex', alignItems:'center', gap:6}}><IconClock size={14} /> Withdraw History</div>
              {withdraws.length===0 ? <div style={{color:'#8B92B8', textAlign:'center', padding:20}}>No withdraws yet</div> :
                withdraws.map(w=>(
                  <div key={w.id} className="task-item" style={{cursor:'default'}}>
                    <div style={{width:36,height:36, borderRadius:10, background: w.status==='Paid'?'#00D68F':'#FFB800', display:'grid', placeItems:'center'}}>{w.status==='Paid'?<IconCheck size={16} />:<IconClock size={16} />}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, display:'flex', alignItems:'center', gap:4}}><CoinTiny size={12} />{w.amount.toLocaleString()} Coins • {w.method}</div>
                      <div style={{fontSize:12, color:'#8B92B8'}}>{w.date} • <span style={{color: w.status==='Paid'?'#00D68F':'#FFB800', display:'inline-flex', alignItems:'center', gap:4}}>{w.status==='Paid'?<IconCheck size={10} />:<IconClock size={10} />} {w.status}</span></div>
                    </div>
                    <div style={{fontWeight:700, color:'#8B92B8', display:'flex', alignItems:'center', gap:4}}><CoinTiny size={10} /> ${(w.amount/1000*RATE_USD_PER_1000).toFixed(2)}</div>
                  </div>
                ))
              }
            </div>

            <div className="card" style={{background:'rgba(255,184,0,0.08)', borderColor:'rgba(255,184,0,0.2)'}}>
              <div style={{fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:6}}><IconShield size={14} /> Withdraw Rules</div>
              <div style={{fontSize:12, color:'#8B92B8', lineHeight:1.8, marginTop:6}}>
                • Payment within 24 hours<br/>
                • Fake referrals will be banned<br/>
                • One account per device • <span style={{display:'inline-flex', alignItems:'center', gap:4}}><CoinTiny size={10} /> Anti-fraud protected</span>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active={tab} onChange={(id)=>{haptic('light'); setTab(id)}} />

      {toast && <div className="toast"><CoinSmall size={16} /> {toast}</div>}

      {showWithdraw && (
        <div className="modal-overlay" onClick={()=>setShowWithdraw(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontWeight:800, fontSize:18, display:'flex', alignItems:'center', gap:8}}><CoinSVG size={24} /> Withdraw</h3>
            <p style={{color:'#8B92B8', fontSize:13, marginTop:4, display:'flex', alignItems:'center', gap:4}}>Balance: {balance.toLocaleString()} coins (<CoinTiny size={10} /> ${usdValue.toFixed(2)})</p>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:16}}>
              {['bKash','Nagad','USDT'].map(m=>(
                <button key={m} onClick={()=>setWithdrawMethod(m)} className="btn-secondary" style={{justifyContent:'center', background: withdrawMethod===m? 'linear-gradient(135deg,#6C5CFF,#9B6DFF)':'var(--card)', color: withdrawMethod===m?'white':'#8B92B8', borderColor: withdrawMethod===m?'transparent':'var(--border)'}}>{m}</button>
              ))}
            </div>

            <div style={{marginTop:14}}>
              <div style={{fontSize:12, color:'#8B92B8', marginBottom:6}}>{withdrawMethod} Number / Address</div>
              <input className="input" placeholder={withdrawMethod==='USDT' ? 'TRC20 Address' : '01XXXXXXXXX'} value={withdrawAcc} onChange={e=>setWithdrawAcc(e.target.value)} />
            </div>
            <div style={{marginTop:10, fontSize:12, color: balance>=WITHDRAW_MIN?'#00D68F':'#FF3B5C', display:'flex', alignItems:'center', gap:6}}>
              {balance>=WITHDRAW_MIN ? <><IconCheck size={12} /> Eligible to withdraw {balance.toLocaleString()} coins</> : <><IconClock size={12} /> Need {(WITHDRAW_MIN-balance).toLocaleString()} more coins (Min {WITHDRAW_MIN})</>}
            </div>
            <button className="btn-primary" style={{marginTop:14}} onClick={handleWithdraw} disabled={balance < WITHDRAW_MIN}><CoinSmall size={16} /> Confirm Withdraw</button>
            <button className="btn-secondary" style={{width:'100%', justifyContent:'center', marginTop:8, background:'transparent'}} onClick={()=>setShowWithdraw(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
