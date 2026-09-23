import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, verifyPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json()
  const identifier = String(body.identifier ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } })
  if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 })
  await createSession(user.id)
  return NextResponse.json({ ok: true })
}
