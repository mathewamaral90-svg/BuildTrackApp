import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const build = await prisma.build.findFirst({ where: { id, ownerId: user.id }, include: { parts: true, tasks: true, expenses: true, journal: true } })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  return NextResponse.json({ build })
}
