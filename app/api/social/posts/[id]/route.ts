import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.socialPost.findFirst({ where: { id, authorId: user.id }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  await prisma.socialPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
