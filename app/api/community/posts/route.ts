import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const posts = await prisma.assistancePost.findMany({
    orderBy: { createdAt: 'desc' }, take: 50,
    include: { author: { select: { username: true, displayName: true } }, build: { select: { id: true, year: true, make: true, model: true } } }
  })
  return NextResponse.json({ posts })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const title = String(body.title ?? '').trim()
  const content = String(body.content ?? '').trim()
  const buildId = body.buildId ? String(body.buildId) : null
  if (!title || !content) return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 })
  if (title.length > 140 || content.length > 3000) return NextResponse.json({ error: 'Title or description is too long.' }, { status: 400 })
  if (buildId) {
    const build = await prisma.build.findFirst({ where: { id: buildId, ownerId: user.id }, select: { id: true } })
    if (!build) return NextResponse.json({ error: 'You can only attach your own build.' }, { status: 403 })
  }
  const post = await prisma.assistancePost.create({ data: { authorId: user.id, buildId, title, content }, include: { author: { select: { username: true, displayName: true } }, build: { select: { id: true, year: true, make: true, model: true } } } })
  return NextResponse.json({ post }, { status: 201 })
}
