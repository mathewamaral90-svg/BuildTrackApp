'use client'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Build={id:string;year:number;make:string;model:string;nickname?:string|null;progress:number;owner:{username:string;displayName:string};_count:{comments:number;follows:number;reactions:number};liked?:boolean}
type Post={id:string;title:string;content:string;createdAt:string;author:{username:string;displayName:string};build?:{id:string;year:number;make:string;model:string}|null}

export default function Community(){
 const [builds,setBuilds]=useState<Build[]>([]),[posts,setPosts]=useState<Post[]>([]),[show,setShow]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true),[query,setQuery]=useState(''),[mode,setMode]=useState<'latest'|'following'>('latest'),[unread,setUnread]=useState(0)
 async function load(q='',m: 'latest'|'following'=mode){
  setLoading(true)
  const url=m==='following'?'/api/feed':q?'/api/discover?q='+encodeURIComponent(q):'/api/community'
  const r=await fetch(url); const d=await r.json()
  if(!r.ok) throw Error(d.error)
  setBuilds(d.builds||[]); if(m==='latest'&&!q)setPosts(d.posts||[]); setLoading(false)
 }
 async function refreshNotifications(){const r=await fetch('/api/notifications');if(r.ok){const d=await r.json();setUnread(d.unreadCount||0)}}
 async function search(e:FormEvent<HTMLFormElement>){e.preventDefault();setError('');setMode('latest');try{await load(query,'latest')}catch(e){setError(e instanceof Error?e.message:'Search failed');setLoading(false)}}
 useEffect(()=>{load().catch(e=>{setError(e.message);setLoading(false)});refreshNotifications()},[])
 async function switchMode(m:'latest'|'following'){
  setError('');setQuery('');setMode(m)
  try{await load('',m)}catch(e){if(m==='following'&&String(e).includes('Unauthorized')){location.href='/login';return}setError(e instanceof Error?e.message:'Could not load feed');setLoading(false)}
 }
 async function toggleLike(id:string){
  const r=await fetch('/api/builds/'+id+'/reaction',{method:'POST'}); if(r.status===401){location.href='/login';return}
  const d=await r.json(); if(!r.ok){setError(d.error||'Could not update like');return}
  setBuilds(bs=>bs.map(b=>b.id===id?{...b,liked:d.liked,_count:{...b._count,reactions:Math.max(0,b._count.reactions+(d.liked?1:-1))}}:b))
 }
 async function ask(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');const f=new FormData(e.currentTarget)
  const r=await fetch('/api/community/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f.entries()))});const d=await r.json()
  if(r.status===401){location.href='/login';return} if(!r.ok){setError(d.error);return}
  e.currentTarget.reset();setShow(false);await load('', 'latest')
 }
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><nav className="community-nav"><Link href="/community">Community</Link><Link href="/notifications" className="activity-link">🔔 Activity{unread>0&&<span className="notification-badge">{unread>99?'99+':unread}</span>}</Link><Link href="/dashboard">Garage</Link><Link className="btn btn-primary" href="/register">Join</Link></nav></div></header>
 <section className="dash-main">
  <div className="community-hero"><div><div className="eyebrow">BUILDTRACK COMMUNITY</div><h1>{mode==='following'?'Your feed.':'See what people are building.'}</h1><p className="muted">{mode==='following'?'Latest updates from builders and projects you follow.':'Discover builds, follow projects, and ask other builders for help.'}</p></div><button className="btn btn-primary" onClick={()=>setShow(!show)}>＋ Ask the community</button></div>
  <div className="feed-tabs"><button className={'btn '+(mode==='latest'?'btn-primary':'btn-ghost')} onClick={()=>switchMode('latest')}>Latest</button><button className={'btn '+(mode==='following'?'btn-primary':'btn-ghost')} onClick={()=>switchMode('following')}>Following</button></div>
  {mode==='latest'&&<form className="discover-search" onSubmit={search}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search builds, cars, builders, or nicknames…" aria-label="Search community"/><button className="btn btn-primary">Search</button>{query&&<button type="button" className="btn btn-ghost" onClick={()=>{setQuery('');load().catch(e=>setError(e.message))}}>Clear</button>}</form>}
  {show&&<form className="panel form" onSubmit={ask}><h2>Ask for help</h2><input name="title" placeholder="What are you working on?" required/><textarea name="content" placeholder="Explain the problem or question…" required/><input name="buildId" placeholder="Optional build ID"/><button className="btn btn-primary">Post question</button></form>}
  {error&&<div className="error">{error}</div>}
  {loading?<p className="muted">Loading community…</p>:<div className="community-layout"><div><h2 className="section-title">{query ? "Search results for “"+query+"”" : mode==='following'?'Following feed':'Latest builds'}</h2>{mode==='following'&&!builds.length?<div className="empty"><h2>Your feed is empty.</h2><p className="muted">Follow a builder or build to see their updates here.</p><Link className="btn btn-primary" href="/community">Discover builds</Link></div>:<div className="build-grid community-builds">{builds.map(b=><div className="build-card" key={b.id}><Link href={'/builds/'+b.id}><div className="build-meta">{b.year} {b.make}</div><h2>{b.model}</h2><p className="muted">{b.nickname||'Build project'} · {b.progress}% complete</p><p className="muted">by <b>{b.owner.displayName}</b> · {b._count.comments} comments · {b._count.follows} followers</p></Link><div className="card-social"><button className={'btn btn-ghost like-btn '+(b.liked?'liked':'')} onClick={()=>toggleLike(b.id)}>{b.liked?'♥ Liked':'♡ Like'} · {b._count.reactions}</button><Link className="small-link" href={'/builds/'+b.id}>View build →</Link></div></div>)}</div>}</div><div><h2 className="section-title">Help wanted</h2><div className="list">{posts.map(p=><article className="panel help-card" key={p.id}><small>by <Link className="small-link" href={'/users/'+p.author.username}>{p.author.displayName}</Link> · {new Date(p.createdAt).toLocaleDateString()}</small><h3>{p.title}</h3><p>{p.content}</p>{p.build&&<Link className="small-link" href={'/builds/'+p.build.id}>View {p.build.year} {p.build.make} {p.build.model} →</Link>}</article>)}</div>{!posts.length&&mode==='latest'&&<div className="empty"><p className="muted">No questions yet. Be the first.</p></div>}</div></div>}
 </section></main>
}