import { NextResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
export const runtime='nodejs'
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const build=await prisma.build.findFirst({where:{id,ownerId:user.id}}); if(!build)return NextResponse.json({error:'Build not found'},{status:404})
 const b=await req.json(); const title=String(b.title??'').trim(); const content=String(b.content??'').trim(); if(!title||!content)return NextResponse.json({error:'Title and entry are required.'},{status:400})
 const entry=await prisma.journal.create({data:{buildId:id,title,content,imageUrl:String(b.imageUrl??'').trim()||null}}); return NextResponse.json({entry},{status:201})
}