import { getServerSession } from 'next-auth';
import { authOptions } from './auth.js';

/**
 * Get the current user from the NextAuth session in API Route Handlers.
 * Usage: const user = await getAuthUser();
 */
export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    username: session.user.username,
    role: session.user.role,
  };
}

export function requireRole(allowedRoles) {
  return async (req, context, handler) => {
    const user = await getAuthUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!allowedRoles.includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(req, context, user);
  };
}
