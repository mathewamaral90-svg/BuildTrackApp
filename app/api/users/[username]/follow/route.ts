import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const me = await getCurrentUser()
  const { username } = await params
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  if (!target) return NextResponse.json({ error: 'Builder not found.' }, { status: 404 })
  const following = me ? !!(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me.id, followingId: target.id } } })) : false
  return NextResponse.json({ following })
}

export async function POST(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { username } = await params
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true, displayName: true } })
  if (!target) return NextResponse.json({ error: 'Builder not found.' }, { status: 404 })
  if (target.id === me.id) return NextResponse.json({ error: 'You cannot follow yourself.' }, { status: 400 })

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } }
  })
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    create: { followerId: me.id, followingId: target.id },
    update: {}
  })

  if (!existing) {
    await prisma.notification.create({
      data: {
        userId: target.id,
        actorId: me.id,
        type: 'follow',
        message: `${me.displayName} started following you.`
      }
    })
  }

  return NextResponse.json({ following: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { username } = await params
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  if (!target) return NextResponse.json({ error: 'Builder not found.' }, { status: 404 })
  await prisma.follow.deleteMany({ where: { followerId: me.id, followingId: target.id } })
  return NextResponse.json({ following: false })
}
