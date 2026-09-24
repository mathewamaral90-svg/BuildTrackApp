import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const [builds, posts] = await Promise.all([
    prisma.build.findMany({
      orderBy: { updatedAt: 'desc' }, take: 20,
      include: { owner: { select: { username: true, displayName: true } }, photos: { where: { isCover: true }, take: 1, select: { url: true } }, _count: { select: { comments: true, follows: true, reactions: true } } }
    }),
    prisma.assistancePost.findMany({
      orderBy: { createdAt: 'desc' }, take: 20,
      include: {
        author: { select: { username: true, displayName: true } },
        build: { select: { id: true, year: true, make: true, model: true } },
        answers: {
          orderBy: [{ accepted: 'desc' }, { createdAt: 'asc' }],
          take: 3,
          include: { author: { select: { username: true, displayName: true } } }
        },
        _count: { select: { answers: true } }
      }
    })
  ])
  return NextResponse.json({ builds: builds.map(b => ({ ...b, coverUrl: b.photos[0]?.url || null, photos: undefined })), posts })
}
