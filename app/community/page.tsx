'use client'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Build={id:string;year:number;make:string;model:string;nickname?:string|null;progress:number;owner:{username:string;displayName:string};_count:{comments:number;follows:number}}
type Post={id:string;title:string;content:string;createdAt:string;author:{username:string;displayName:string};build?:{id:string;year:number;make:string;model:string}|null}

export default function Community(){
 const [builds,setBuilds]=useState<Build[]>([]),[posts,setPosts]=useState<Post[]>([]),[show,setShow]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 async function load(){const r=await fetch('/api/community');const d=await r.json();if(!r.ok)throw Error(d.error);setBuilds(d.builds);setPosts(d.posts);setLoading(false)}
 useEffect(()=>{load().catch(e=>{setError(e.message);setLoading(false)})},[])
 async function ask(e:FormEvent<HTMLFormElement>){e.preventDefault();setError('');const f=new FormData(e.currentTarget);const r=await fetch('/api/community/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f.entries()))});const d=await r.json();if(r.status===401){location.href='/login';return}if(!r.ok){setError(d.error);return}e.currentTarget.reset();setShow(false);await load()}
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><nav className="community-nav"><Link href="/community">Community</Link><Link href="/dashboard">Garage</Link><Link className="btn btn-primary" href="/register">Join</Link></nav></div></header>
 <section className="dash-main">
  <div className="community-hero"><div><div className="eyebrow">BUILDTRACK COMMUNITY</div><h1>See what people are building.</h1><p className="muted">Discover builds, follow projects, and ask other builders for help.</p></div><button className="btn btn-primary" onClick={()=>setShow(!show)}>＋ Ask the community</button></div>
  {show&&<form className="panel form" onSubmit={ask}><h2>Ask for help</h2><input name="title" placeholder="What are you working on?" required/><textarea name="content" placeholder="Explain the problem or question…" required/><input name="buildId" placeholder="Optional build ID"/><button className="btn btn-primary">Post question</button></form>}
  {error&&<div className="error">{error}</div>}
  {loading?<p className="muted">Loading community…</p>:<div className="community-layout"><div><h2 className="section-title">Latest builds</h2><div className="build-grid community-builds">{builds.map(b=><Link href={'/builds/'+b.id} className="build-card" key={b.id}><div className="build-meta">{b.year} {b.make}</div><h2>{b.model}</h2><p className="muted">{b.nickname||'Build project'} · {b.progress}% complete</p><p className="muted">by <b>{b.owner.displayName}</b> · {b._count.comments} comments · {b._count.follows} followers</p></Link>)}</div></div><div><h2 className="section-title">Help wanted</h2><div className="list">{posts.map(p=><article className="panel help-card" key={p.id}><small>by <Link className="small-link" href={'/users/'+p.author.username}>{p.author.displayName}</Link> · {new Date(p.createdAt).toLocaleDateString()}</small><h3>{p.title}</h3><p>{p.content}</p>{p.build&&<Link className="small-link" href={'/builds/'+p.build.id}>View {p.build.year} {p.build.make} {p.build.model} →</Link>}</article>)}</div>{!posts.length&&<div className="empty"><p className="muted">No questions yet. Be the first.</p></div>}</div></div>}
 </section></main>
}
