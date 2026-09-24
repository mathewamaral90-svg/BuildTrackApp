import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true, displayName: true, bio: true, avatarUrl: true, createdAt: true,
      _count: { select: { builds: true, followsFollowers: true, followsFollowing: true, socialPosts: true, socialLikes: true } },
      builds: { orderBy: { updatedAt: 'desc' }, include: { _count: { select: { comments: true, follows: true, reactions: true } } } },
      socialPosts: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          build: { select: { id: true, year: true, make: true, model: true, nickname: true } },
          _count: { select: { likes: true, comments: true } }
        }
      }
    }
  })
  if (!user) return NextResponse.json({ error: 'Builder not found.' }, { status: 404 })
  return NextResponse.json({ user })
}
