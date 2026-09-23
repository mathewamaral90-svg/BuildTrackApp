import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

async function notifyBuildFollowers(buildId:string,actorId:string,type:string,message:string){const build=await prisma.build.findUnique({where:{id:buildId},select:{ownerId:true}});if(!build)return;const followers=await prisma.buildFollow.findMany({where:{buildId,userId:{not:actorId}},select:{userId:true}});const recipients=new Set(followers.map(f=>f.userId));if(build.ownerId!==actorId)recipients.add(build.ownerId);if(!recipients.size)return;await prisma.notification.createMany({data:[...recipients].map(userId=>({userId,actorId,buildId,type,message}))})}
async function notifyBuilderFollowers(actorId:string,type:string,message:string,buildId?:string){const followers=await prisma.follow.findMany({where:{followingId:actorId,followerId:{not:actorId}},select:{followerId:true}});if(!followers.length)return;await prisma.notification.createMany({data:followers.map(f=>({userId:f.followerId,actorId,buildId:buildId??null,type,message}))})}

export const runtime='nodejs'
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const build=await prisma.build.findFirst({where:{id,ownerId:user.id}}); if(!build)return NextResponse.json({error:'Build not found'},{status:404})
 const b=await req.json(); const title=String(b.title??'').trim(); const content=String(b.content??'').trim(); if(!title||!content)return NextResponse.json({error:'Title and entry are required.'},{status:400})
 const entry=await prisma.journal.create({data:{buildId:id,title,content,imageUrl:String(b.imageUrl??'').trim()||null}})
 await notifyBuildFollowers(id,user.id,'journal',user.displayName+' posted a new build update: "'+title+'".')
 return NextResponse.json({entry},{status:201})
}
