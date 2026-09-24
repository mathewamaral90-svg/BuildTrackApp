import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const answers = await prisma.assistanceAnswer.findMany({
    where: { postId: id },
    orderBy: [{ accepted: 'desc' }, { createdAt: 'asc' }],
    include: { author: { select: { username: true, displayName: true } } }
  })
  return NextResponse.json({ answers })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.assistancePost.findUnique({ where: { id }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
  const body = await req.json()
  const content = String(body.content ?? '').trim()
  if (!content || content.length > 2000) return NextResponse.json({ error: 'Answer must be 1–2000 characters.' }, { status: 400 })
  const answer = await prisma.assistanceAnswer.create({
    data: { postId: id, authorId: user.id, content },
    include: { author: { select: { username: true, displayName: true } } }
  })
  return NextResponse.json({ answer }, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const answerId = String(body.answerId ?? '')
  const post = await prisma.assistancePost.findUnique({ where: { id }, select: { id: true, authorId: true } })
  if (!post) return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
  if (post.authorId !== user.id) return NextResponse.json({ error: 'Only the question author can accept an answer.' }, { status: 403 })
  const answer = await prisma.assistanceAnswer.findUnique({ where: { id: answerId }, select: { id: true, postId: true } })
  if (!answer || answer.postId !== id) return NextResponse.json({ error: 'Answer not found.' }, { status: 404 })
  await prisma.$transaction([
    prisma.assistanceAnswer.updateMany({ where: { postId: id }, data: { accepted: false } }),
    prisma.assistanceAnswer.update({ where: { id: answerId }, data: { accepted: true } }),
    prisma.assistancePost.update({ where: { id }, data: { solved: true } })
  ])
  return NextResponse.json({ solved: true, acceptedAnswerId: answerId })
}
