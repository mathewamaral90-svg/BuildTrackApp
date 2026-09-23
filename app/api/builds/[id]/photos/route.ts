import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const { id } = await params
  const build = await prisma.build.findUnique({where:{id},select:{ownerId:true}})
  if (!build) return NextResponse.json({error:'Build not found.'},{status:404})
  if (build.ownerId !== user.id) return NextResponse.json({error:'Only the owner can add photos.'},{status:403})
  const body = await req.json().catch(()=>({}))
  const url = typeof body.url==='string' ? body.url.trim() : ''
  const caption = typeof body.caption==='string' ? body.caption.trim() : null
  if (!url || !/^https?:\/\//i.test(url)) return NextResponse.json({error:'Enter a valid image URL.'},{status:400})
  const journal = await prisma.journal.create({data:{buildId:id,title:caption||'Build photo',content:caption||'Photo update',imageUrl:url}})
  return NextResponse.json({journal},{status:201})
}