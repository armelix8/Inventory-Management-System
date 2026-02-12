import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'your-secret-key-change-in-production';

/**
 * Role-based authorization middleware
 * Usage: authorize(['ADMIN', 'MANAGER'])
 */
export function authorize(allowedRoles) {
  return async (req, res, next) => {
    try {
      // Authenticate token first
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      // Get user from database to check role
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true, isActive: true, username: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user.role = user.role;
      req.user.username = user.username || decoded.username;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      res.status(500).json({ error: error.message });
    }
  };
}
