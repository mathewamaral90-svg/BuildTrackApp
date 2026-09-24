import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const now = new Date()
  const challenges = await prisma.challenge.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { endsAt: 'asc' },
    include: {
      entries: {
        orderBy: { progress: 'desc' },
        take: 10,
        include: { user: { select: { username: true, displayName: true, avatarUrl: true } } }
      },
      _count: { select: { entries: true } }
    }
  })
  return NextResponse.json({ challenges })
}
