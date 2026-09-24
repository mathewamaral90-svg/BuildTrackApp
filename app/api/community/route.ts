import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const now = new Date()
  const [builds, trendingSource, posts, manualFeatures] = await Promise.all([
    prisma.build.findMany({
      orderBy: { updatedAt: 'desc' }, take: 20,
      include: { owner: { select: { username: true, displayName: true } }, photos: { where: { isCover: true }, take: 1, select: { url: true } }, _count: { select: { comments: true, follows: true, reactions: true } } }
    }),
    prisma.build.findMany({
      orderBy: { updatedAt: 'desc' }, take: 50,
      include: { owner: { select: { username: true, displayName: true } }, photos: { where: { isCover: true }, take: 1, select: { url: true } }, _count: { select: { comments: true, follows: true, reactions: true } } }
    }),
    prisma.assistancePost.findMany({
      orderBy: { createdAt: 'desc' }, take: 20,
      include: {
        author: { select: { username: true, displayName: true } },
        build: { select: { id: true, year: true, make: true, model: true } },
        answers: { orderBy: [{ accepted: 'desc' }, { createdAt: 'asc' }], take: 3, include: { author: { select: { username: true, displayName: true } } } },
        _count: { select: { answers: true } }
      }
    }),
    prisma.featuredBuild.findMany({
      where: { startAt: { lte: now }, OR: [{ endAt: null }, { endAt: { gt: now } }] },
      orderBy: [{ kind: 'asc' }, { startAt: 'desc' }],
      include: { build: { include: { owner: { select: { username: true, displayName: true } }, photos: { where: { isCover: true }, take: 1, select: { url: true } }, _count: { select: { comments: true, follows: true, reactions: true } } } } }
    })
  ])
  const toCard = (b: typeof builds[number]) => ({ ...b, coverUrl: b.photos[0]?.url || null, photos: undefined })
  const score = (b: typeof trendingSource[number]) => b._count.reactions * 3 + b._count.comments * 2 + b._count.follows
  const trending = trendingSource
    .map(b => ({ ...b, coverUrl: b.photos[0]?.url || null, photos: undefined, trendScore: score(b) }))
    .sort((a, b) => b.trendScore - a.trendScore || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentFeatured = trendingSource
    .filter(b => new Date(b.updatedAt) >= weekAgo)
    .map(b => ({ ...toCard(b), featureScore: score(b) }))
    .sort((a, b) => b.featureScore - a.featureScore || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
  const manualFeatured = manualFeatures.filter(f => f.kind === 'featured').map(f => ({ ...toCard(f.build), featureScore: score(f.build) })).slice(0, 3)
  const featured = manualFeatured.length ? manualFeatured : recentFeatured.length ? recentFeatured : trending.slice(0, 3)
  const manualWeek = manualFeatures.find(f => f.kind === 'week')
  const buildOfWeek = manualWeek ? { ...toCard(manualWeek.build), featureScore: score(manualWeek.build) } : featured[0] || null
  return NextResponse.json({ builds: builds.map(toCard), trending, featured, buildOfWeek, posts })
}
