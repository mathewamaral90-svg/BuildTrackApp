'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Notification={id:string;message:string;read:boolean;createdAt:string;buildId?:string|null;actor?:{username:string;displayName:string}|null}

export default function NotificationsPage(){
 const [items,setItems]=useState<Notification[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 async function load(){
  const r=await fetch('/api/notifications'); const d=await r.json()
  if(r.status===401){location.href='/login';return}
  if(!r.ok)throw Error(d.error)
  setItems(d.notifications); setLoading(false)
 }
 useEffect(()=>{load().catch(e=>{setError(e.message);setLoading(false)})},[])
 async function markRead(){await fetch('/api/notifications',{method:'PATCH'});setItems(items.map(n=>({...n,read:true})))} 
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><nav className="community-nav"><Link href="/community">Community</Link><Link href="/dashboard">Garage</Link></nav></div></header>
 <section className="dash-main"><div className="dash-head"><div><div className="eyebrow">ACTIVITY</div><h1>Notifications</h1><p className="muted">Likes, follows and other activity on your builds.</p></div>{items.some(n=>!n.read)&&<button className="btn btn-ghost" onClick={markRead}>Mark all read</button>}</div>
 {error&&<div className="error">{error}</div>}{loading?<p className="muted">Loading notifications…</p>:!items.length?<div className="empty"><h2>You're all caught up.</h2><p className="muted">Activity from the community will appear here.</p></div>:<div className="list">{items.map(n=><article className="panel help-card" key={n.id} style={{opacity:n.read?.7:1}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><p style={{margin:0}}>{n.actor?<><Link className="small-link" href={'/users/'+n.actor.username}>{n.actor.displayName}</Link>{' '}</>:null}{n.message.replace(n.actor?.displayName||'','').trim()}</p>{n.buildId&&<Link className="small-link" href={'/builds/'+n.buildId}>View build →</Link>}</div>{!n.read&&<span className="build-meta">NEW</span>}</div><small>{new Date(n.createdAt).toLocaleString()}</small></article>)}</div>}
 </section></main>
}
