import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.socialPost.findUnique({ where: { id }, select: { id: true, authorId: true } })
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  const body = await req.json(); const content = String(body.content ?? '').trim()
  if (!content || content.length > 2000) return NextResponse.json({ error: 'Comment must be 1–2000 characters.' }, { status: 400 })
  const comment = await prisma.socialComment.create({ data: { postId: id, userId: user.id, content }, include: { user: { select: { username: true, displayName: true } } } })
  if (post.authorId !== user.id) await prisma.notification.create({ data: { userId: post.authorId, actorId: user.id, type: 'post_comment', message: user.displayName + ' commented on your community post.' } })
  return NextResponse.json({ comment }, { status: 201 })
}
