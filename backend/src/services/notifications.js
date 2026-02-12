import prisma from '../lib/prisma.js';

/**
 * Create notifications for users.
 */
export async function createNotifications({ userIds, type, title, message, link }) {
  if (!userIds?.length) return;
  const data = userIds.map((userId) => ({
    userId,
    type,
    title,
    message,
    link: link ?? null,
  }));
  await prisma.notification.createMany({ data });
}

/** Notify ADMIN/MANAGER users of new pending stock-out request. */
export async function notifyAdminsOfPendingRequest(itemName, quantity) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    select: { id: true },
  });
  const userIds = admins.map((u) => u.id);
  await createNotifications({
    userIds,
    type: 'PENDING_APPROVAL',
    title: 'New stock-out request',
    message: `${quantity} x ${itemName} needs approval`,
    link: '/stock-out?status=PENDING',
  });
}

/** Notify the requesting user of approval/rejection. */
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
