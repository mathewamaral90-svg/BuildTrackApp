import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const build = await prisma.build.findUnique({
    where: { id },
    include: {
      owner: { select: { username: true, displayName: true, bio: true } },
      parts: true, tasks: true, expenses: true, journal: true,
      _count: { select: { comments: true, follows: true } }
    }
  })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  const following = user ? !!(await prisma.buildFollow.findUnique({ where: { userId_buildId: { userId: user.id, buildId: id } } })) : false
  return NextResponse.json({ build, isOwner: user?.id === build.ownerId, following })
}
