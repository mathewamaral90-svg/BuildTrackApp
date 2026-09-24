import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  const { searchParams } = new URL(req.url)
  const following = searchParams.get('following') === 'true'
  const take = Math.min(Number(searchParams.get('limit')) || 30, 50)

  let authorIds: string[] | undefined
  let buildIds: string[] | undefined
  if (following) {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const [people, builds] = await Promise.all([
      prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }),
      prisma.buildFollow.findMany({ where: { userId: user.id }, select: { buildId: true } })
    ])
    authorIds = people.map(x => x.followingId)
    buildIds = builds.map(x => x.buildId)
  }

  const posts = await prisma.socialPost.findMany({
    where: following ? { OR: [{ authorId: { in: authorIds || [] } }, { buildId: { in: buildIds || [] } }] } : undefined,
    orderBy: { createdAt: 'desc' }, take,
    include: {
      author: { select: { username: true, displayName: true, avatarUrl: true } },
      build: { select: { id: true, year: true, make: true, model: true, nickname: true } },
      _count: { select: { likes: true, comments: true } },
      likes: user ? { where: { userId: user.id }, select: { id: true } } : false,
      comments: { orderBy: { createdAt: 'asc' }, take: 3, include: { user: { select: { username: true, displayName: true } } } }
    }
  })
  return NextResponse.json({ posts: posts.map(p => ({ ...p, liked: p.likes.length > 0, likes: undefined })) })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const content = String(body.content ?? '').trim()
  if (!content || content.length > 5000) return NextResponse.json({ error: 'Post must be 1–5000 characters.' }, { status: 400 })
  const buildId = String(body.buildId ?? '').trim() || null
  if (buildId) {
    const build = await prisma.build.findFirst({ where: { id: buildId, ownerId: user.id }, select: { id: true } })
    if (!build) return NextResponse.json({ error: 'You can only attach your own build.' }, { status: 403 })
  }
  const post = await prisma.socialPost.create({ data: { authorId: user.id, buildId, content, imageUrl: String(body.imageUrl ?? '').trim() || null }, include: { author: { select: { username: true, displayName: true, avatarUrl: true } }, build: true, _count: { select: { likes: true, comments: true } } } })
  return NextResponse.json({ post }, { status: 201 })
}
