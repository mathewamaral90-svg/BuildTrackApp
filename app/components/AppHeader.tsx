'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AppHeader(){
  const [authenticated,setAuthenticated]=useState(false)
  const [unread,setUnread]=useState(0)
  useEffect(()=>{
    let alive=true
    fetch('/api/auth/me').then(async r=>{const d=await r.json();if(alive)setAuthenticated(!!d.authenticated)}).catch(()=>{})
    fetch('/api/notifications').then(async r=>{if(r.ok){const d=await r.json();if(alive)setUnread(d.unreadCount||0)}}).catch(()=>{})
    return ()=>{alive=false}
  },[])
  async function logout(){await fetch('/api/auth/logout',{method:'POST'});location.href='/login'}
  return <header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><nav className="community-nav">
    <Link href="/community">Community</Link>
    <Link href="/feed">Feed</Link>
    <Link href="/notifications" className="activity-link">🔔 Activity{unread>0&&<span className="notification-badge">{unread>99?'99+':unread}</span>}</Link>
    <Link href="/dashboard">Garage</Link>
    <Link href="/profile">Profile</Link>
    {authenticated ? <button className="btn btn-ghost" onClick={logout}>Log out</button> : <><Link className="btn btn-ghost" href="/login">Log in</Link><Link className="btn btn-primary" href="/register">Join</Link></>}
  </nav></div></header>
}
