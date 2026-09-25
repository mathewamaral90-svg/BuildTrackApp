import Link from 'next/link'
import SocialFeed from '@/app/community/SocialFeed'

export default function FeedPage(){
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><nav className="community-nav"><Link className="active-nav" href="/feed">Feed</Link><Link href="/community">Community</Link><Link href="/notifications">🔔 Activity</Link><Link href="/leaderboard">🏆 Leaderboard</Link><Link href="/dashboard">Garage</Link><Link className="btn btn-primary" href="/profile">Profile</Link></nav></div></header><section className="dash-main feed-main"><SocialFeed/></section></main>
}