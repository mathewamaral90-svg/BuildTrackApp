import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const make = (searchParams.get('make') || '').trim()
  const where = {
    ...(q ? { OR: [
      { make: { contains: q, mode: 'insensitive' as const } },
      { model: { contains: q, mode: 'insensitive' as const } },
      { nickname: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { owner: { displayName: { contains: q, mode: 'insensitive' as const } } },
      { owner: { username: { contains: q, mode: 'insensitive' as const } } }
    ] } : {}),
    ...(make ? { make: { equals: make, mode: 'insensitive' as const } } : {})
  }
  const builds = await prisma.build.findMany({
    where, orderBy: { updatedAt: 'desc' }, take: 40,
    include: { owner: { select: { username: true, displayName: true } }, _count: { select: { comments: true, follows: true } } }
  })
  return NextResponse.json({ builds })
}
