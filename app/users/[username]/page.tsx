'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type User={username:string;displayName:string;bio?:string|null;avatarUrl?:string|null;createdAt:string;_count:{builds:number;followsFollowers:number;followsFollowing:number;socialPosts:number;socialLikes:number};builds:any[];socialPosts:any[]}
export default function Profile(){
 const {username}=useParams<{username:string}>(); const [user,setUser]=useState<User|null>(null),[following,setFollowing]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{fetch('/api/users/'+username).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setUser(d.user)}).catch(e=>setError(e.message));fetch('/api/users/'+username+'/follow').then(async r=>{if(r.ok){const d=await r.json();setFollowing(!!d.following)}}).catch(()=>{})},[username])
 async function toggle(){setBusy(true);const r=await fetch('/api/users/'+username+'/follow',{method:following?'DELETE':'POST'});const d=await r.json();if(r.status===401){location.href='/login';return}if(!r.ok){setError(d.error)}else setFollowing(d.following);setBusy(false)}
 if(error&&!user)return <main className="auth-wrap"><div className="auth-card"><p className="error">{error}</p><Link href="/community" className="small-link">Back to community</Link></div></main>
 if(!user)return <main className="auth-wrap"><p className="muted">Loading profile…</p></main>
 const badges=[
  user._count.builds>=1&&{icon:'🏁',title:'First Build',text:'Started the garage journey'},
  user._count.builds>=3&&{icon:'🔧',title:'Multi-Build',text:'Three or more builds tracked'},
  user._count.builds>=5&&{icon:'🏆',title:'Garage Builder',text:'Five or more builds tracked'},
  user._count.socialPosts>=5&&{icon:'📣',title:'Active Builder',text:'Five or more community updates'},
  user._count.socialPosts>=10&&{icon:'🔥',title:'Build Regular',text:'Ten or more community updates'},
  user._count.followsFollowers>=10&&{icon:'🤝',title:'Community Builder',text:'Ten or more followers'}
 ].filter(Boolean) as {icon:string;title:string;text:string}[]
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><div className="community-nav"><Link href="/community">Community</Link><Link href="/notifications">Activity</Link><Link href="/dashboard">Garage</Link></div></div></header><section className="dash-main">
 <div className="profile-hero"><div><div className="avatar">{user.avatarUrl?<img src={user.avatarUrl} alt={user.displayName}/>:user.displayName.slice(0,1).toUpperCase()}</div><h1>{user.displayName}</h1><p className="muted">@{user.username}</p><p className="public-description">{user.bio||'Building cars and sharing the process.'}</p><div className="profile-stats"><span><b>{user._count.builds}</b> builds</span><span><b>{user._count.socialPosts}</b> updates</span><span><b>{user._count.followsFollowers}</b> followers</span><span><b>{user._count.followsFollowing}</b> following</span></div></div><button className="btn btn-primary" onClick={toggle} disabled={busy}>{following?'Following':'Follow builder'}</button></div>
 <div className="panel reputation-panel"><div><h2>Builder reputation</h2><p className="muted">Milestones earned from building, sharing and connecting with the community.</p></div><div className="badge-grid">{badges.map(x=><div className="badge" key={x.title}><span>{x.icon}</span><div><b>{x.title}</b><small>{x.text}</small></div></div>)}{!badges.length&&<div className="muted">Keep building and sharing to unlock your first badges.</div>}</div></div><div className="profile-showcase"><div><h2 className="section-title">Garage showcase</h2><div className="build-grid">{user.builds.map(b=><Link href={'/builds/'+b.id} className="build-card" key={b.id}>{b.coverUrl&&<img className="build-card-image" src={b.coverUrl} alt=""/>}<div className="build-meta">{b.year} {b.make}</div><h2>{b.model}</h2><p className="muted">{b.nickname||'Build project'} · {b.progress}% complete</p><div className="progress"><i style={{width:b.progress+'%'}}/></div><p className="muted">{b._count.comments} comments · {b._count.follows} followers · {b._count.reactions} likes</p></Link>)}</div>{!user.builds.length&&<div className="empty"><p className="muted">No public builds yet.</p></div>}</div>
 <div><h2 className="section-title">Recent updates</h2><div className="profile-updates">{user.socialPosts.map(p=><article className="panel profile-update" key={p.id}><p>{p.content}</p>{p.build&&<Link className="build-chip" href={'/builds/'+p.build.id}>{p.build.coverUrl&&<img className="build-chip-image" src={p.build.coverUrl} alt=""/>}🏎️ {p.build.year} {p.build.make} {p.build.model}</Link>}<div className="muted profile-update-meta">{new Date(p.createdAt).toLocaleDateString()} · ♥ {p._count.likes} · 💬 {p._count.comments}</div></article>)}</div>{!user.socialPosts.length&&<div className="empty"><p className="muted">No updates yet.</p></div>}</div></div>
 </section></main>
}
