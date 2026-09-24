import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim().toLowerCase()
  const generic = { message: 'If an account exists for that email, a password reset link has been sent.' }
  if (!email) return NextResponse.json(generic)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json(generic)

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://buildtrackapp-production.up.railway.app'
  const resetUrl = appUrl + '/reset-password?token=' + token
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (apiKey && from && user.email) {
    const emailResponse = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [user.email], subject: 'Reset your BuildTrack password', html: '<p>Hi ' + user.displayName + ',</p><p>We received a request to reset your BuildTrack password.</p><p><a href="' + resetUrl + '">Reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>' }) })
    if (!emailResponse.ok) console.error('Password reset email failed:', await emailResponse.text())
  } else {
    console.warn('Password reset email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.')
  }

  return NextResponse.json(generic)
}
