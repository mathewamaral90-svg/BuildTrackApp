import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyBuildFollowers } from '@/lib/notifications'
export const runtime='nodejs'
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const build=await prisma.build.findFirst({where:{id,ownerId:user.id},select:{id:true}}); if(!build)return NextResponse.json({error:'Build not found'},{status:404})
 const b=await req.json(); const description=String(b.description??'').trim(); const amount=Number(b.amount); if(!description||!Number.isFinite(amount)||amount<0)return NextResponse.json({error:'Description and a valid amount are required.'},{status:400})
 const expense=await prisma.expense.create({data:{buildId:id,description,amount}}); const agg=await prisma.expense.aggregate({where:{buildId:id},_sum:{amount:true}}); await prisma.build.update({where:{id},data:{spent:agg._sum.amount??0}})
 await notifyBuildFollowers(id,user.id,'expense',user.displayName+' added a $'+amount.toFixed(2)+' expense to your build.')
 return NextResponse.json({expense},{status:201})
}
