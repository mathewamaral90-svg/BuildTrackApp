import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

async function notifyBuildFollowers(buildId:string,actorId:string,type:string,message:string){const build=await prisma.build.findUnique({where:{id:buildId},select:{ownerId:true}});if(!build)return;const followers=await prisma.buildFollow.findMany({where:{buildId,userId:{not:actorId}},select:{userId:true}});const recipients=new Set(followers.map(f=>f.userId));if(build.ownerId!==actorId)recipients.add(build.ownerId);if(!recipients.size)return;await prisma.notification.createMany({data:[...recipients].map(userId=>({userId,actorId,buildId,type,message}))})}
async function notifyBuilderFollowers(actorId:string,type:string,message:string,buildId?:string){const followers=await prisma.follow.findMany({where:{followingId:actorId,followerId:{not:actorId}},select:{followerId:true}});if(!followers.length)return;await prisma.notification.createMany({data:followers.map(f=>({userId:f.followerId,actorId,buildId:buildId??null,type,message}))})}

export const runtime='nodejs'
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const build=await prisma.build.findFirst({where:{id,ownerId:user.id},select:{id:true,year:true,make:true,model:true}}); if(!build)return NextResponse.json({error:'Build not found'},{status:404})
 const b=await req.json(); const name=String(b.name??'').trim(); if(!name)return NextResponse.json({error:'Part name is required.'},{status:400})
 const part=await prisma.part.create({data:{buildId:id,name,manufacturer:String(b.manufacturer??'').trim()||null,category:String(b.category??'').trim()||null,price:Number(b.price)||0,status:String(b.status??'planned'),notes:String(b.notes??'').trim()||null}})
 await notifyBuildFollowers(id,user.id,'part',user.displayName+' added "'+name+'" to '+build.year+' '+build.make+' '+build.model+'.')
 return NextResponse.json({part},{status:201})
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const build=await prisma.build.findFirst({where:{id,ownerId:user.id}}); if(!build)return NextResponse.json({error:'Build not found'},{status:404})
 const b=await req.json(); await prisma.part.deleteMany({where:{id:String(b.partId),buildId:id}}); return NextResponse.json({ok:true})
}
