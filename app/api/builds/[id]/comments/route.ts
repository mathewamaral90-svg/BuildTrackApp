import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = await prisma.comment.findMany({
    where: { buildId: id }, orderBy: { createdAt: 'desc' },
    include: { user: { select: { username: true, displayName: true } } }
  })
  return NextResponse.json({ comments })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const content = String(body.content ?? '').trim()
  if (!content || content.length > 1000) return NextResponse.json({ error: 'Comment must be 1–1000 characters.' }, { status: 400 })
  const build = await prisma.build.findUnique({ where: { id }, select: { id: true } })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  const comment = await prisma.comment.create({ data: { buildId: id, userId: user.id, content }, include: { user: { select: { username: true, displayName: true } } } })
  return NextResponse.json({ comment }, { status: 201 })
}
