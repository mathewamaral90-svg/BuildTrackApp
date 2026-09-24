import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
export const runtime='nodejs'
export async function GET(){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const builds=await prisma.build.findMany({where:{ownerId:user.id},orderBy:{updatedAt:'desc'},select:{id:true,year:true,make:true,model:true,nickname:true,progress:true,budget:true,spent:true,createdAt:true,updatedAt:true,_count:{select:{parts:true,tasks:true,expenses:true,journal:true,reactions:true,follows:true,comments:true}},tasks:{select:{status:true}},parts:{select:{status:true}}}})
 const [followers,updates,likes,buildFollows]=await Promise.all([prisma.follow.count({where:{followingId:user.id}}),prisma.socialPost.count({where:{authorId:user.id}}),prisma.reaction.count({where:{build:{ownerId:user.id}}}),prisma.buildFollow.count({where:{build:{ownerId:user.id}}})])
 const totalBudget=builds.reduce((n,b)=>n+b.budget,0), totalSpent=builds.reduce((n,b)=>n+b.spent,0), avgProgress=builds.length?Math.round(builds.reduce((n,b)=>n+b.progress,0)/builds.length):0, completedBuilds=builds.filter(b=>b.progress>=100).length
 const taskTotal=builds.reduce((n,b)=>n+b.tasks.length,0),taskDone=builds.reduce((n,b)=>n+b.tasks.filter(t=>['done','complete','completed'].includes(t.status)).length,0),partsTotal=builds.reduce((n,b)=>n+b.parts.length,0),partsDone=builds.reduce((n,b)=>n+b.parts.filter(p=>['installed','complete','completed'].includes(p.status)).length,0)
 return NextResponse.json({summary:{builds:builds.length,completedBuilds,avgProgress,totalBudget,totalSpent,remainingBudget:Math.max(0,totalBudget-totalSpent),followers,updates,likes,buildFollows},work:{partsTotal,partsDone,partsRemaining:Math.max(0,partsTotal-partsDone),tasksTotal:taskTotal,tasksDone:taskDone,tasksRemaining:Math.max(0,taskTotal-taskDone),taskCompletion:taskTotal?Math.round(taskDone/taskTotal*100):0},recentBuilds:builds.slice(0,5).map(b=>({id:b.id,label:b.year+' '+b.make+' '+b.model,nickname:b.nickname,progress:b.progress,budget:b.budget,spent:b.spent,updatedAt:b.updatedAt,parts:b._count.parts,tasks:b._count.tasks,likes:b._count.reactions,follows:b._count.follows}))})
}
