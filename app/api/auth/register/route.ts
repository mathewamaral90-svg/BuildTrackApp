import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const username = String(body.username ?? '').trim().toLowerCase()
    const displayName = String(body.displayName ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase() || null
    const password = String(body.password ?? '')

    if (!/^[a-z0-9_]{3,24}$/.test(username)) return NextResponse.json({ error: 'Username must be 3-24 characters using letters, numbers, or underscores.' }, { status: 400 })
    if (displayName.length < 2 || displayName.length > 60) return NextResponse.json({ error: 'Enter a display name.' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })

    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, ...(email ? [{ email }] : [])] } })
    if (existing) return NextResponse.json({ error: 'That username or email is already registered.' }, { status: 409 })

    const user = await prisma.user.create({ data: { username, displayName, email, passwordHash: hashPassword(password) } })
    await createSession(user.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 })
  }
}
