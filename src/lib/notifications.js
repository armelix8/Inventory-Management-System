import prisma from './prisma.js';

export async function createNotifications({ userIds, type, title, message, link }) {
  if (!userIds?.length) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, message, link: link ?? null })),
  });
}

export async function notifyAdminsOfPendingRequest(itemName, quantity) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    select: { id: true },
  });
  if (admins.length) {
    await createNotifications({
      userIds: admins.map((u) => u.id),
      type: 'PENDING_APPROVAL',
      title: 'New stock-out request',
      message: `${quantity} x ${itemName} needs approval`,
      link: '/stock-out?status=PENDING',
    });
  }
}

export async function notifyRequesterOfDecision(username, type, itemName, quantity) {
  const user = await prisma.user.findFirst({
    where: { username, isActive: true },
    select: { id: true },
  });
  if (!user) return;
  const isApproved = type === 'APPROVED';
  await createNotifications({
    userIds: [user.id],
    type: isApproved ? 'APPROVED' : 'REJECTED',
    title: isApproved ? 'Request approved' : 'Request rejected',
    message: isApproved
      ? `Your request for ${quantity} x ${itemName} was approved`
      : `Your request for ${quantity} x ${itemName} was rejected`,
    link: '/stock-out',
  });
}
