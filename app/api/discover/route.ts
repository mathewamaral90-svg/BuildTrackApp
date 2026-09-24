import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const make = (searchParams.get('make') || '').trim()
  const model = (searchParams.get('model') || '').trim()
  const year = Number(searchParams.get('year') || 0)
  const status = (searchParams.get('status') || '').trim()
  const where = {
    ...(q ? { OR: [
      { make: { contains: q, mode: 'insensitive' as const } },
      { model: { contains: q, mode: 'insensitive' as const } },
      { nickname: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { owner: { displayName: { contains: q, mode: 'insensitive' as const } } },
      { owner: { username: { contains: q, mode: 'insensitive' as const } } }
    ] } : {}),
    ...(make ? { make: { equals: make, mode: 'insensitive' as const } } : {}),
    ...(model ? { model: { contains: model, mode: 'insensitive' as const } } : {}),
    ...(year >= 1886 && year <= 2100 ? { year } : {}),
    ...(status === 'complete' ? { progress: 100 } : status === 'in-progress' ? { progress: { gt: 0, lt: 100 } } : status === 'not-started' ? { progress: 0 } : {})
  }
  const builds = await prisma.build.findMany({
    where, orderBy: { updatedAt: 'desc' }, take: 40,
    include: { owner: { select: { username: true, displayName: true } }, _count: { select: { comments: true, follows: true } } }
  })
  return NextResponse.json({ builds, filters: { q, make, model, year: year || null, status: status || null } })
}
