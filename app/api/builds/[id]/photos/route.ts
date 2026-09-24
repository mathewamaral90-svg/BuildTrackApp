import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const build = await prisma.build.findUnique({
    where: { id },
    select: { id: true, photos: { orderBy: { createdAt: 'desc' } }, journal: { where: { imageUrl: { not: null } }, orderBy: { createdAt: 'desc' } } }
  })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  const photos = [
    ...build.photos.map(p => ({ ...p, legacy: false })),
    ...build.journal.filter(j => j.imageUrl).map(j => ({
      id: 'journal-' + j.id, buildId: id, url: j.imageUrl!, caption: j.title, isCover: false, createdAt: j.createdAt, legacy: true
    }))
  ]
  const cover = photos.find(p => p.isCover) || photos[0] || null
  return NextResponse.json({ photos, cover })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const build = await prisma.build.findUnique({ where: { id }, select: { ownerId: true } })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  if (build.ownerId !== user.id) return NextResponse.json({ error: 'Only the owner can manage photos.' }, { status: 403 })
  const contentType = req.headers.get('content-type') || ''
  let url = ''
  let caption: string | null = null
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    url = typeof body.url === 'string' ? body.url.trim() : ''
    caption = typeof body.caption === 'string' ? body.caption.trim() : null
  } else if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('file')
    caption = typeof form.get('caption') === 'string' ? String(form.get('caption')).trim() || null : null
    if (file instanceof File) {
      if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })
      if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image must be 4 MB or smaller.' }, { status: 400 })
      const bytes = Buffer.from(await file.arrayBuffer())
      url = 'data:' + file.type + ';base64,' + bytes.toString('base64')
    }
  }
  const isDataImage = /^data:image\/(jpeg|png|webp|gif);base64,/i.test(url)
  const isRemoteImage = /^https?:\/\//i.test(url)
  if (!isDataImage && !isRemoteImage) return NextResponse.json({ error: 'Upload an image or enter a valid image URL.' }, { status: 400 })
  if (isDataImage && url.length > 3_000_000) return NextResponse.json({ error: 'Image is too large. Please choose a smaller image.' }, { status: 400 })
  const count = await prisma.buildPhoto.count({ where: { buildId: id } })
  const photo = await prisma.buildPhoto.create({ data: { buildId: id, url, caption, isCover: count === 0 } })
  return NextResponse.json({ photo }, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const build = await prisma.build.findUnique({ where: { id }, select: { ownerId: true } })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  if (build.ownerId !== user.id) return NextResponse.json({ error: 'Only the owner can manage photos.' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const photoId = typeof body.photoId === 'string' ? body.photoId : ''
  if (!photoId) return NextResponse.json({ error: 'Photo is required.' }, { status: 400 })
  const photo = await prisma.buildPhoto.findFirst({ where: { id: photoId, buildId: id } })
  if (!photo) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })
  await prisma.buildPhoto.updateMany({ where: { buildId: id }, data: { isCover: false } })
  const updated = await prisma.buildPhoto.update({ where: { id: photoId }, data: { isCover: true } })
  return NextResponse.json({ photo: updated })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const build = await prisma.build.findUnique({ where: { id }, select: { ownerId: true } })
  if (!build) return NextResponse.json({ error: 'Build not found.' }, { status: 404 })
  if (build.ownerId !== user.id) return NextResponse.json({ error: 'Only the owner can manage photos.' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const photoId = typeof body.photoId === 'string' ? body.photoId : ''
  const photo = await prisma.buildPhoto.findFirst({ where: { id: photoId, buildId: id } })
  if (!photo) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })
  await prisma.buildPhoto.delete({ where: { id: photoId } })
  if (photo.isCover) {
    const next = await prisma.buildPhoto.findFirst({ where: { buildId: id }, orderBy: { createdAt: 'desc' } })
    if (next) await prisma.buildPhoto.update({ where: { id: next.id }, data: { isCover: true } })
  }
  return NextResponse.json({ ok: true })
}
