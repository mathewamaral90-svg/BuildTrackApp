import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const build=await prisma.build.findUnique({where:{id},select:{ownerId:true}}); if(!build)return NextResponse.json({error:'Build not found.'},{status:404})
 const existing=await prisma.reaction.findUnique({where:{userId_buildId:{userId:user.id,buildId:id}}})
 if(existing){await prisma.reaction.delete({where:{id:existing.id}});return NextResponse.json({liked:false})}
 await prisma.reaction.create({data:{userId:user.id,buildId:id,type:'like'}})
 if(build.ownerId!==user.id) await prisma.notification.create({data:{userId:build.ownerId,actorId:user.id,buildId:id,type:'reaction',message:`${user.displayName} liked your build.`}})
 return NextResponse.json({liked:true})
}