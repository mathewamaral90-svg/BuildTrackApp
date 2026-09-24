'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Entry={id:string;username:string;displayName:string;avatarUrl?:string|null;rank:number;score:number;earned:number;totalAchievements:number;_count:{builds:number;socialPosts:number;followsFollowers:number};buildLikes:number;buildFollows:number;nextAchievement:{icon:string;title:string;target:number;value:number;unit:string}|null}

export default function Leaderboard(){
 const [entries,setEntries]=useState<Entry[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 useEffect(()=>{fetch('/api/leaderboard').then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Could not load leaderboard');setEntries(d.leaderboard)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><nav className="community-nav"><Link href="/community">Community</Link><Link href="/notifications">🔔 Activity</Link><Link href="/dashboard">Garage</Link></nav></div></header>
 <section className="dash-main"><div className="community-hero"><div><div className="eyebrow">BUILDER COMPETITION</div><h1>Builder leaderboard.</h1><p className="muted">A running score for builders who track projects, share updates and grow their garage community.</p></div><Link className="btn btn-primary" href="/community">Back to community</Link></div>
 <div className="panel leaderboard-rules"><div><h2>How Builder Score works</h2><p className="muted">Scores are calculated from activity already tracked in BuildTrack. There are no paid boosts or hidden bonuses.</p></div><div className="score-rules"><span><b>+100</b> build</span><span><b>+15</b> update</span><span><b>+5</b> follower</span><span><b>+2</b> build like</span><span><b>+1</b> build follow</span></div></div>
 {error&&<div className="error">{error}</div>}
 {loading?<p className="muted">Loading leaderboard…</p>:<div className="leaderboard-list">{entries.map(e=><Link className={'leaderboard-row '+(e.rank<=3?'top-three':'')} href={'/users/'+e.username} key={e.id}><span className="leaderboard-rank">#{e.rank}</span>{e.avatarUrl?<img src={e.avatarUrl} alt=""/>:<span className="leaderboard-avatar">{e.displayName.slice(0,1).toUpperCase()}</span>}<span className="leaderboard-person"><b>{e.displayName}</b><small>@{e.username}</small></span><span className="leaderboard-stats"><b>{e._count.builds}</b> builds · <b>{e._count.socialPosts}</b> updates · <b>{e._count.followsFollowers}</b> followers</span><span className="leaderboard-achievements">{e.earned}/{e.totalAchievements} 🏆</span><strong>{e.score.toLocaleString()}</strong></Link>)}{!entries.length&&<div className="empty"><p className="muted">No builders yet.</p></div>}</div>}
 </section></main>
}
