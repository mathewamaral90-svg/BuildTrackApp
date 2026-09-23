import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyBuildFollowers } from '@/lib/notifications'
export const runtime='nodejs'

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const build=await prisma.build.findFirst({where:{id,ownerId:user.id},select:{id:true}})
 if(!build)return NextResponse.json({error:'Build not found'},{status:404})
 const b=await req.json(); const name=String(b.name??'').trim(); if(!name)return NextResponse.json({error:'Task name is required.'},{status:400})
 const task=await prisma.task.create({data:{buildId:id,name,category:String(b.category??'').trim()||null,status:String(b.status??'todo'),priority:String(b.priority??'normal')}})
 await notifyBuildFollowers(id,user.id,'task',user.displayName+' added a new task: "'+name+'".')
 return NextResponse.json({task},{status:201})
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {id}=await params; const b=await req.json()
 const task=await prisma.task.findFirst({where:{id:String(b.taskId),build:{id,ownerId:user.id}}})
 if(!task)return NextResponse.json({error:'Task not found'},{status:404})
 const nextStatus=String(b.status)
 const updated=await prisma.task.update({where:{id:task.id},data:{status:nextStatus}})
 const tasks=await prisma.task.findMany({where:{buildId:id}})
 const done=tasks.filter(t=>t.status==='done').length
 await prisma.build.update({where:{id},data:{progress:tasks.length?Math.round(done/tasks.length*100):0}})
 if (task.status !== nextStatus) {
   await notifyBuildFollowers(id,user.id,'task_update',user.displayName+' updated "'+task.name+'" to '+nextStatus+'.')
 }
 return NextResponse.json({task:updated})
}
