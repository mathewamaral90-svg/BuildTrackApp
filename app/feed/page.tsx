import Link from 'next/link'
import SocialFeed from '@/app/community/SocialFeed'
import AppHeader from '@/app/components/AppHeader'

export default function FeedPage(){
 return <main className="dashboard"><AppHeader/><section className="dash-main feed-main"><SocialFeed/></section></main>
}