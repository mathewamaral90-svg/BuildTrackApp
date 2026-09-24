import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const token = String(body.token ?? '')
  const password = String(body.password ?? '')
  if (!token || password.length < 8) return NextResponse.json({ error: 'Please provide a valid reset link and a password of at least 8 characters.' }, { status: 400 })
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
  if (!reset || reset.expiresAt < new Date()) return NextResponse.json({ error: 'This password reset link is invalid or has expired.' }, { status: 400 })
  await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: hashPassword(password) } })
  await prisma.passwordResetToken.delete({ where: { id: reset.id } })
  await prisma.session.deleteMany({ where: { userId: reset.userId } })
  return NextResponse.json({ ok: true })
}
