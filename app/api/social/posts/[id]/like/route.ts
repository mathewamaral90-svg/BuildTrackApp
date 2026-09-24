import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.socialPost.findUnique({ where: { id }, select: { id: true, authorId: true } })
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  const existing = await prisma.socialLike.findUnique({ where: { userId_postId: { userId: user.id, postId: id } } })
  if (existing) await prisma.socialLike.delete({ where: { id: existing.id } })
  else {
    await prisma.socialLike.create({ data: { userId: user.id, postId: id } })
    if (post.authorId !== user.id) await prisma.notification.create({ data: { userId: post.authorId, actorId: user.id, type: 'post_like', message: user.displayName + ' liked your community post.' } })
  }
  const count = await prisma.socialLike.count({ where: { postId: id } })
  return NextResponse.json({ liked: !existing, count })
}
