import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});const notifications=await prisma.notification.findMany({where:{userId:user.id},orderBy:{createdAt:'desc'},take:50,include:{actor:{select:{username:true,displayName:true}}}});return NextResponse.json({notifications})}
export async function PATCH(){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});await prisma.notification.updateMany({where:{userId:user.id,read:false},data:{read:true}});return NextResponse.json({ok:true})}