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
  for (const c of defaults) {
    await prisma.challenge.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, startsAt: now, endsAt: end }
    })
  }
}

export async function GET() {
  await ensureChallenges()
  const now = new Date()
  const challenges = await prisma.challenge.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { endsAt: 'asc' },
    include: {
      entries: { orderBy: { progress: 'desc' }, take: 10, include: { user: { select: { username: true, displayName: true, avatarUrl: true } } } },
      _count: { select: { entries: true } }
    }
  })
  return NextResponse.json({ challenges })
}
