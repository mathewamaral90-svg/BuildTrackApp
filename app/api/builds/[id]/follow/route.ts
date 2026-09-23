import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const { id } = await params
  const count = await prisma.buildFollow.count({ where: { buildId: id } })
  const following = user ? !!(await prisma.buildFollow.findUnique({ where: { userId_buildId: { userId: user.id, buildId: id } } })) : false
  return NextResponse.json({ following, count })
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const build = await prisma.build.findUnique({
    where: { id },
    select: { id: true, ownerId: true }
  })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })

  const existing = await prisma.buildFollow.findUnique({
    where: { userId_buildId: { userId: user.id, buildId: id } }
  })
  await prisma.buildFollow.upsert({
    where: { userId_buildId: { userId: user.id, buildId: id } },
    create: { userId: user.id, buildId: id },
    update: {}
  })

  if (!existing && build.ownerId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: build.ownerId,
        actorId: user.id,
        buildId: id,
        type: 'build_follow',
        message: `${user.displayName} started following your build.`
      }
    })
  }

  return NextResponse.json({ following: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.buildFollow.deleteMany({ where: { userId: user.id, buildId: id } })
  return NextResponse.json({ following: false })
}
