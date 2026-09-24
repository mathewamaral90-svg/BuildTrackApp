import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function MyProfileRedirect() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  redirect('/users/' + encodeURIComponent(user.username))
}
