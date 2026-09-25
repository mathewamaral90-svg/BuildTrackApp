import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const currentUser = await getCurrentUser()
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, username: true, displayName: true, bio: true, avatarUrl: true, createdAt: true,
      _count: { select: { builds: true, followsFollowers: true, followsFollowing: true, socialPosts: true, socialLikes: true } },
      builds: { orderBy: { updatedAt: 'desc' }, include: { photos: { where: { isCover: true }, take: 1, select: { url: true } }, _count: { select: { comments: true, follows: true, reactions: true } } } },
      socialPosts: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          build: { select: { id: true, year: true, make: true, model: true, nickname: true, photos: { where: { isCover: true }, take: 1, select: { url: true } } } },
          _count: { select: { likes: true, comments: true } }
        }
      }
    }
  })
  if (!user) return NextResponse.json({ error: 'Builder not found.' }, { status: 404 })
  return NextResponse.json({ user: { ...user, isOwner: currentUser?.id === user.id, builds: user.builds.map(b => ({ ...b, coverUrl: b.photos[0]?.url || null, photos: undefined })), socialPosts: user.socialPosts.map(p => ({ ...p, build: p.build ? { ...p.build, coverUrl: p.build.photos[0]?.url || null, photos: undefined } : null })) } })
}


export async function PUT(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const currentUser = await getCurrentUser()
  if (!currentUser) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (currentUser.username !== username) return NextResponse.json({ error: 'You can only edit your own builder profile.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const bio = String(body.bio ?? '').trim()
  const avatarUrl = body.avatarUrl == null || body.avatarUrl === '' ? currentUser.avatarUrl : String(body.avatarUrl).trim()

  if (bio.length > 500) return NextResponse.json({ error: 'Bio must be 500 characters or less.' }, { status: 400 })
  if (avatarUrl && avatarUrl.length > 3000000) return NextResponse.json({ error: 'Profile photo is too large.' }, { status: 400 })
  if (avatarUrl && !/^data:image\/(jpeg|png|webp|gif);base64,/i.test(avatarUrl) && !/^https?:\/\//i.test(avatarUrl)) {
    return NextResponse.json({ error: 'Invalid profile photo.' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: { bio: bio || null, avatarUrl: avatarUrl || null },
    select: { username: true, displayName: true, bio: true, avatarUrl: true, createdAt: true }
  })
  return NextResponse.json({ user })
}
