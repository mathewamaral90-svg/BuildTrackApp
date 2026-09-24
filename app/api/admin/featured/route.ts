import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

function isAdmin(user: { username: string }) {
  const allowed = (process.env.BUILDTRACK_ADMIN_USERNAMES || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean)
  return allowed.includes(user.username.toLowerCase())
}

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isAdmin(user)) return { error: NextResponse.json({ error: 'Admin access is not configured for this account.' }, { status: 403 }) }
  return { user }
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const now = new Date()
  const [builds, features] = await Promise.all([
    prisma.build.findMany({ orderBy: { updatedAt: 'desc' }, take: 100, select: { id: true, year: true, make: true, model: true, nickname: true, owner: { select: { username: true, displayName: true } } } }),
    prisma.featuredBuild.findMany({ orderBy: [{ kind: 'asc' }, { startAt: 'desc' }], include: { build: { select: { id: true, year: true, make: true, model: true, nickname: true, owner: { select: { username: true, displayName: true } } } } } })
  ])
  return NextResponse.json({ builds, features, activeFeatures: features.filter(f => f.startAt <= now && (!f.endAt || f.endAt > now)) })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const body = await req.json()
  const buildId = String(body.buildId || '')
  const kind = body.kind === 'week' ? 'week' : 'featured'
  if (!buildId) return NextResponse.json({ error: 'Build is required.' }, { status: 400 })
  const build = await prisma.build.findUnique({ where: { id: buildId }, select: { id: true } })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  const startAt = body.startAt ? new Date(body.startAt) : new Date()
  const endAt = body.endAt ? new Date(body.endAt) : null
  if (Number.isNaN(startAt.getTime()) || (endAt && Number.isNaN(endAt.getTime()))) return NextResponse.json({ error: 'Invalid feature dates.' }, { status: 400 })
  if (endAt && endAt <= startAt) return NextResponse.json({ error: 'End date must be after the start date.' }, { status: 400 })
  if (kind === 'week') await prisma.featuredBuild.deleteMany({ where: { kind: 'week', buildId: { not: buildId } } })
  const feature = await prisma.featuredBuild.upsert({ where: { buildId }, update: { kind, startAt, endAt }, create: { buildId, kind, startAt, endAt } })
  return NextResponse.json({ feature }, { status: 201 })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const body = await req.json()
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'Feature id is required.' }, { status: 400 })
  await prisma.featuredBuild.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
