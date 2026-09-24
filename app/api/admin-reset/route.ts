import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const configuredToken = process.env.BUILDTRACK_ADMIN_RESET_TOKEN
  if (!configuredToken) {
    return NextResponse.json({ error: 'Admin reset is currently disabled.' }, { status: 404 })
  }

  let body: { token?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const token = String(body.token ?? '')
  const password = String(body.password ?? '')

  if (!token || token.length < 20 || token !== configuredToken) {
    return NextResponse.json({ error: 'Invalid reset key.' }, { status: 403 })
  }

  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: 'Password must be between 8 and 200 characters.' }, { status: 400 })
  }

  const adminUsername = (process.env.BUILDTRACK_ADMIN_USERNAMES || 'Mick_EvoAdmin')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)[0] || 'Mick_EvoAdmin'

  const user = await prisma.user.findFirst({
    where: { username: { equals: adminUsername, mode: 'insensitive' } },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Admin account was not found.' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ])

  return NextResponse.json({ ok: true })
}
