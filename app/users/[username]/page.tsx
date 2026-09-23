'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type User={username:string;displayName:string;bio?:string|null;createdAt:string;_count:{builds:number;followsFollowers:number;followsFollowing:number};builds:any[]}
export default function Profile(){
 const {username}=useParams<{username:string}>(); const [user,setUser]=useState<User|null>(null),[following,setFollowing]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{fetch('/api/users/'+username).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setUser(d.user)}).catch(e=>setError(e.message));fetch('/api/users/'+username+'/follow').then(()=>{})},[username])
 async function toggle(){setBusy(true);const r=await fetch('/api/users/'+username+'/follow',{method:following?'DELETE':'POST'});const d=await r.json();if(r.status===401){location.href='/login';return}if(!r.ok){setError(d.error)}else setFollowing(d.following);setBusy(false)}
 if(error&&!user)return <main className="auth-wrap"><div className="auth-card"><p className="error">{error}</p><Link href="/community" className="small-link">Back to community</Link></div></main>
 if(!user)return <main className="auth-wrap"><p className="muted">Loading profile…</p></main>
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><div className="community-nav"><Link href="/community">Community</Link><Link href="/dashboard">Garage</Link></div></div></header><section className="dash-main"><div className="profile-hero"><div><div className="avatar">{user.displayName.slice(0,1).toUpperCase()}</div><h1>{user.displayName}</h1><p className="muted">@{user.username}</p><p>{user.bio||'Building cars and sharing the process.'}</p><div className="profile-stats"><span><b>{user._count.builds}</b> builds</span><span><b>{user._count.followsFollowers}</b> followers</span><span><b>{user._count.followsFollowing}</b> following</span></div></div><button className="btn btn-primary" onClick={toggle} disabled={busy}>{following?'Following':'Follow builder'}</button></div><h2 className="section-title">Public builds</h2><div className="build-grid">{user.builds.map(b=><Link href={'/builds/'+b.id} className="build-card" key={b.id}><div className="build-meta">{b.year} {b.make}</div><h2>{b.model}</h2><p className="muted">{b.nickname||'Build project'} · {b.progress}% complete</p><p className="muted">{b._count.comments} comments · {b._count.follows} followers</p></Link>)}</div>{!user.builds.length&&<div className="empty"><p className="muted">No public builds yet.</p></div>}</section></main>
}
