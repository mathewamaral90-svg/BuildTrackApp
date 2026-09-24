import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { socialPosts: { some: { createdAt: { gte: since } } } },
        { builds: { some: { updatedAt: { gte: since } } } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      _count: {
        select: {
          builds: true,
          socialPosts: true,
          followsFollowers: true
        }
      },
      builds: {
        where: { updatedAt: { gte: since } },
        orderBy: { updatedAt: 'desc' },
        take: 2,
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
          progress: true,
          updatedAt: true,
          photos: {
            where: { isCover: true },
            take: 1,
            select: { url: true }
          }
        }
      },
      socialPosts: {
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, createdAt: true }
      }
    }
  })

  const active = users.map(user => {
    const recentBuilds = user.builds.length
    const recentPosts = user.socialPosts.length
    const score = recentPosts * 3 + recentBuilds * 2 + Math.min(user._count.followsFollowers, 20) * 0.25
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      buildsCount: user._count.builds,
      postsCount: user._count.socialPosts,
      followersCount: user._count.followsFollowers,
      recentBuilds,
      recentPosts,
      score,
      builds: user.builds.map(build => ({
        ...build,
        coverUrl: build.photos[0]?.url || null,
        photos: undefined
      }))
    }
  }).sort((a, b) => b.score - a.score || b.recentPosts - a.recentPosts || b.recentBuilds - a.recentBuilds).slice(0, 12)

  return NextResponse.json({ builders: active, windowDays: 30 })
}
