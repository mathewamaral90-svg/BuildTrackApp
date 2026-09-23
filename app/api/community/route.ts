import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const [builds, posts] = await Promise.all([
    prisma.build.findMany({
      orderBy: { updatedAt: 'desc' }, take: 20,
      include: { owner: { select: { username: true, displayName: true } }, _count: { select: { comments: true, follows: true } } }
    }),
    prisma.assistancePost.findMany({
      orderBy: { createdAt: 'desc' }, take: 20,
      include: { author: { select: { username: true, displayName: true } }, build: { select: { id: true, year: true, make: true, model: true } } }
    })
  ])
  return NextResponse.json({ builds, posts })
}
