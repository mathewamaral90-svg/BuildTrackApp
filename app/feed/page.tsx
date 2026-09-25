'use client'
import Link from 'next/link'
import SocialFeed from '@/app/community/SocialFeed'
import { useEffect, useState } from 'react'

export default function FeedPage(){
 const [loggedIn,setLoggedIn]=useState(false)
 useEffect(()=>{fetch('/api/me').then(r=>setLoggedIn(r.ok)).catch(()=>{})},[])
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><nav className="community-nav"><Link className="active-nav" href="/feed">Feed</Link><Link href="/community">Community</Link><Link href="/notifications">🔔 Activity</Link><Link href="/leaderboard">🏆 Leaderboard</Link><Link href="/dashboard">Garage</Link>{loggedIn?<Link className="btn btn-primary" href="/profile">Profile</Link>:<Link className="btn btn-primary" href="/register">Join</Link>}</nav></div></header><section className="dash-main feed-main"><SocialFeed/></section></main>
}