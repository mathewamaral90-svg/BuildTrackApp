import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

async function notifyBuildFollowers(buildId:string,actorId:string,type:string,message:string){const build=await prisma.build.findUnique({where:{id:buildId},select:{ownerId:true}});if(!build)return;const followers=await prisma.buildFollow.findMany({where:{buildId,userId:{not:actorId}},select:{userId:true}});const recipients=new Set(followers.map(f=>f.userId));if(build.ownerId!==actorId)recipients.add(build.ownerId);if(!recipients.size)return;await prisma.notification.createMany({data:[...recipients].map(userId=>({userId,actorId,buildId,type,message}))})}
async function notifyBuilderFollowers(actorId:string,type:string,message:string,buildId?:string){const followers=await prisma.follow.findMany({where:{followingId:actorId,followerId:{not:actorId}},select:{followerId:true}});if(!followers.length)return;await prisma.notification.createMany({data:followers.map(f=>({userId:f.followerId,actorId,buildId:buildId??null,type,message}))})}

export const runtime = 'nodejs'

// Comments generate activity notifications for the build owner and followers.

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = await prisma.comment.findMany({ where: { buildId: id }, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true, displayName: true } } } })
  return NextResponse.json({ comments })
}
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const content = String(body.content ?? '').trim()
  if (!content || content.length > 1000) return NextResponse.json({ error: 'Comment must be 1–1000 characters.' }, { status: 400 })
  const build = await prisma.build.findUnique({ where: { id }, select: { id: true } })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  const comment = await prisma.comment.create({ data: { buildId: id, userId: user.id, content }, include: { user: { select: { username: true, displayName: true } } } })
  await notifyBuildFollowers(id, user.id, 'comment', user.displayName + ' commented on your build.')
  return NextResponse.json({ comment }, { status: 201 })
}
