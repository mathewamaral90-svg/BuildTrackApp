import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function scoreUser(u: any) {
  const buildLikes = u.builds.reduce((n: number, b: any) => n + b._count.reactions, 0)
  const buildFollows = u.builds.reduce((n: number, b: any) => n + b._count.follows, 0)
  const score = u._count.builds * 100 + u._count.socialPosts * 15 + u._count.followsFollowers * 5 + buildLikes * 2 + buildFollows
  const achievements = [
    { id: 'first-build', icon: '🏁', title: 'First Build', target: 1, value: u._count.builds, unit: 'build' },
    { id: 'multi-build', icon: '🔧', title: 'Multi-Build', target: 3, value: u._count.builds, unit: 'builds' },
    { id: 'garage-builder', icon: '🏆', title: 'Garage Builder', target: 5, value: u._count.builds, unit: 'builds' },
    { id: 'active-builder', icon: '📣', title: 'Active Builder', target: 5, value: u._count.socialPosts, unit: 'updates' },
    { id: 'community-builder', icon: '🤝', title: 'Community Builder', target: 10, value: u._count.followsFollowers, unit: 'followers' }
  ]
  const earned = achievements.filter(a => a.value >= a.target).length
  const next = achievements.find(a => a.value < a.target)
  return { score, buildLikes, buildFollows, earned, totalAchievements: achievements.length, nextAchievement: next ? { ...next, value: Math.min(next.value, next.target) } : null }
}

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      _count: { select: { builds: true, socialPosts: true, followsFollowers: true } },
      builds: { select: { _count: { select: { reactions: true, follows: true } } } }
    }
  })
  const leaderboard = users.map(u => ({ ...u, ...scoreUser(u) }))
    .sort((a, b) => b.score - a.score || b._count.builds - a._count.builds || a.username.localeCompare(b.username))
    .map((u, i) => ({ ...u, rank: i + 1 }))
  return NextResponse.json({ leaderboard, scoring: { build: 100, update: 15, follower: 5, like: 2, buildFollow: 1 } })
}
