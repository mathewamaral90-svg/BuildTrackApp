import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true, displayName: true, bio: true, avatarUrl: true, createdAt: true,
      _count: { select: { builds: true, followsFollowers: true, followsFollowing: true } },
      builds: { orderBy: { updatedAt: 'desc' }, include: { _count: { select: { comments: true, follows: true } } } }
    }
  })
  if (!user) return NextResponse.json({ error: 'Builder not found.' }, { status: 404 })
  return NextResponse.json({ user })
}
