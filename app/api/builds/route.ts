import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyBuilderFollowers } from '@/lib/notifications'


async function notifyBuildFollowers(buildId:string,actorId:string,type:string,message:string){const build=await prisma.build.findUnique({where:{id:buildId},select:{ownerId:true}});if(!build)return;const followers=await prisma.buildFollow.findMany({where:{buildId,userId:{not:actorId}},select:{userId:true}});const recipients=new Set(followers.map(f=>f.userId));if(build.ownerId!==actorId)recipients.add(build.ownerId);if(!recipients.size)return;await prisma.notification.createMany({data:[...recipients].map(userId=>({userId,actorId,buildId,type,message}))})}
async function notifyBuilderFollowers(actorId:string,type:string,message:string,buildId?:string){const followers=await prisma.follow.findMany({where:{followingId:actorId,followerId:{not:actorId}},select:{followerId:true}});if(!followers.length)return;await prisma.notification.createMany({data:followers.map(f=>({userId:f.followerId,actorId,buildId:buildId??null,type,message}))})}

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const builds = await prisma.build.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: 'desc' }, include: { parts: true, tasks: true, expenses: true } })
  return NextResponse.json({ builds })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const year = Number(body.year)
  const make = String(body.make ?? '').trim()
  const model = String(body.model ?? '').trim()
  if (!Number.isInteger(year) || year < 1886 || year > new Date().getFullYear() + 2 || !make || !model) return NextResponse.json({ error: 'Year, make, and model are required.' }, { status: 400 })
  const build = await prisma.build.create({ data: { ownerId: user.id, year, make, model, trim: String(body.trim ?? '').trim() || null, nickname: String(body.nickname ?? '').trim() || null, description: String(body.description ?? '').trim() || null, budget: Number(body.budget) || 0 } })
  await notifyBuilderFollowers(user.id, 'build', user.displayName + ' started a new build: ' + year + ' ' + make + ' ' + model + '.', build.id)
  return NextResponse.json({ build }, { status: 201 })
}
