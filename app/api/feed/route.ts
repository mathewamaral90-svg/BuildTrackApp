import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [builderFollows, buildFollows] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }),
    prisma.buildFollow.findMany({ where: { userId: user.id }, select: { buildId: true } })
  ])

  const followingIds = builderFollows.map(f => f.followingId)
  const buildIds = buildFollows.map(f => f.buildId)

  if (!followingIds.length && !buildIds.length) {
    return NextResponse.json({ builds: [], followingBuilders: 0, followingBuilds: 0 })
  }

  const builds = await prisma.build.findMany({
    where: {
      OR: [
        ...(followingIds.length ? [{ ownerId: { in: followingIds } }] : []),
        ...(buildIds.length ? [{ id: { in: buildIds } }] : [])
      ]
    },
    orderBy: { updatedAt: 'desc' },
    take: 40,
    include: {
      owner: { select: { username: true, displayName: true } },
      photos: { where: { isCover: true }, take: 1, select: { url: true } },
      _count: { select: { comments: true, follows: true, reactions: true } },
      reactions: { where: { userId: user.id }, select: { id: true } }
    }
  })

  return NextResponse.json({
    builds: builds.map(b => ({ ...b, liked: b.reactions.length > 0, coverUrl: b.photos[0]?.url || null, reactions: undefined, photos: undefined })),
    followingBuilders: followingIds.length,
    followingBuilds: buildIds.length
  })
}