import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({ authenticated: !!user, user: user ? { id: user.id, username: user.username, displayName: user.displayName } : null })
}
