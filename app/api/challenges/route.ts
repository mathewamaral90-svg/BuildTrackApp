import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

async function ensureChallenges() {
  const now = new Date()
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const defaults = [
    { slug: 'garage-month', title: 'Garage Month', description: 'Complete 3 build updates during the season.', icon: '🔧', metric: 'updates', target: 3 },
    { slug: 'build-progress', title: 'Progress Push', description: 'Reach 100% progress on one build during the season.', icon: '🏁', metric: 'completed build', target: 1 },
    { slug: 'community-connect', title: 'Community Connect', description: 'Follow 5 builds and join the conversation.', icon: '🤝', metric: 'build follows', target: 5 }
  ]
  for (const c of defaults) await prisma.challenge.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, rewardPoints: 100, startsAt: now, endsAt: end } })
}

async function progressForUser(userId: string, metric: string, since: Date) {
  if (metric === 'updates') return prisma.socialPost.count({ where: { authorId: userId, createdAt: { gte: since } } })
  if (metric === 'completed build') return prisma.build.count({ where: { ownerId: userId, progress: 100, updatedAt: { gte: since } } })
  if (metric === 'build follows') return prisma.buildFollow.count({ where: { userId, createdAt: { gte: since } } })
  return 0
}

export async function GET() {
  await ensureChallenges()
  const now = new Date()
  const challenges = await prisma.challenge.findMany({ where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: { endsAt: 'asc' } })
  const users = await prisma.user.findMany({ select: { id: true, username: true, displayName: true, avatarUrl: true } })

  for (const challenge of challenges) {
    const since = challenge.startsAt
    for (const user of users) {
      const progress = await progressForUser(user.id, challenge.metric, since)
      await prisma.challengeEntry.upsert({
        where: { challengeId_userId: { challengeId: challenge.id, userId: user.id } },
        update: { progress, completedAt: progress >= challenge.target ? new Date() : null },
        create: { challengeId: challenge.id, userId: user.id, progress, completedAt: progress >= challenge.target ? new Date() : null }
      })
    }
  }

  const result = await prisma.challenge.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: { endsAt: 'asc' },
    include: { entries: { where: { progress: { gt: 0 } }, orderBy: { progress: 'desc' }, take: 10, include: { user: { select: { username: true, displayName: true, avatarUrl: true } } } }, _count: { select: { entries: true } } }
  })
  return NextResponse.json({ challenges: result })
}
