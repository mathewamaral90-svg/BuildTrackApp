import { prisma } from '@/lib/prisma'

export async function notifyBuildFollowers(buildId: string, actorId: string, type: string, message: string) {
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    select: { ownerId: true }
  })
  if (!build) return

  const followers = await prisma.buildFollow.findMany({
    where: { buildId, userId: { not: actorId } },
    select: { userId: true }
  })

  const recipients = new Set(followers.map(f => f.userId))
  if (build.ownerId !== actorId) recipients.add(build.ownerId)

  if (!recipients.size) return

  await prisma.notification.createMany({
    data: [...recipients].map(userId => ({
      userId,
      actorId,
      buildId,
      type,
      message
    }))
  })
}

export async function notifyBuilderFollowers(actorId: string, type: string, message: string, buildId?: string) {
  const followers = await prisma.follow.findMany({
    where: { followingId: actorId, followerId: { not: actorId } },
    select: { followerId: true }
  })
  if (!followers.length) return

  await prisma.notification.createMany({
    data: followers.map(f => ({
      userId: f.followerId,
      actorId,
      buildId: buildId ?? null,
      type,
      message
    }))
  })
}
