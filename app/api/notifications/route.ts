import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

const achievements = [
  { id: 'first-build', icon: '🏁', title: 'First Build', target: 1, unit: 'builds', value: (c:any) => c.builds },
  { id: 'multi-build', icon: '🔧', title: 'Multi-Build', target: 3, unit: 'builds', value: (c:any) => c.builds },
  { id: 'garage-builder', icon: '🏆', title: 'Garage Builder', target: 5, unit: 'builds', value: (c:any) => c.builds },
  { id: 'active-builder', icon: '📣', title: 'Active Builder', target: 5, unit: 'updates', value: (c:any) => c.socialPosts },
  { id: 'build-regular', icon: '🔥', title: 'Build Regular', target: 10, unit: 'updates', value: (c:any) => c.socialPosts },
  { id: 'community-builder', icon: '🤝', title: 'Community Builder', target: 10, unit: 'followers', value: (c:any) => c.followers }
]

async function syncAchievementNotifications(userId:string){
  const user=await prisma.user.findUnique({where:{id:userId},select:{_count:{select:{builds:true,socialPosts:true,followsFollowers:true}}}})
  if(!user)return
  const counts={builds:user._count.builds,socialPosts:user._count.socialPosts,followers:user._count.followsFollowers}
  for(const a of achievements){
    const value=a.value(counts)
    if(value<a.target)continue
    const type='achievement:'+a.id
    const existing=await prisma.notification.findFirst({where:{userId,type}})
    if(!existing) await prisma.notification.create({data:{userId,type,message:a.icon+' Achievement unlocked: '+a.title+' — '+a.target+' '+a.unit+'.'}})
  }
}

async function syncChallengeNotifications(userId:string){
  const now=new Date()
  const challenges=await prisma.challenge.findMany({where:{active:true,startsAt:{lte:now},endsAt:{gte:now}}})
  for(const c of challenges){
    let progress=0
    if(c.metric==='updates') progress=await prisma.socialPost.count({where:{authorId:userId,createdAt:{gte:c.startsAt}}})
    else if(c.metric==='completed build') progress=await prisma.build.count({where:{ownerId:userId,progress:100,updatedAt:{gte:c.startsAt}}})
    else if(c.metric==='build follows') progress=await prisma.buildFollow.count({where:{userId,createdAt:{gte:c.startsAt}}})
    const entry=await prisma.challengeEntry.upsert({where:{challengeId_userId:{challengeId:c.id,userId}},update:{progress,completedAt:progress>=c.target?new Date():null},create:{challengeId:c.id,userId,progress,completedAt:progress>=c.target?new Date():null}})
    if(progress>=c.target && !entry.rewardGranted){
      const type='challenge:'+c.id
      const existing=await prisma.notification.findFirst({where:{userId,type}})
      if(!existing) await prisma.notification.create({data:{userId,type,message:'🎉 Challenge complete: '+c.title+'! You earned '+c.rewardPoints+' reward points.'}})
      await prisma.challengeEntry.update({where:{id:entry.id},data:{rewardGranted:true}})
    }
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await syncAchievementNotifications(user.id)
  await syncChallengeNotifications(user.id)
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50, include: { actor: { select: { username: true, displayName: true } } } }),
    prisma.notification.count({ where: { userId: user.id, read: false } })
  ])
  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
  return NextResponse.json({ ok: true, unreadCount: 0 })
}