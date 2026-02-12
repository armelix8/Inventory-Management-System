import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * RoleProtectedRoute - Protects routes based on user roles
 * @param {Array<string>} allowedRoles - Array of roles that can access this route
 * @param {ReactNode} children - Component to render if user has permission
 */
export default function RoleProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    // No role restriction, allow all authenticated users
    return children;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-slate-500">Required role: {allowedRoles.join(' or ')}</p>
          <p className="text-sm text-slate-500">Your role: {user.role}</p>
        </div>
      </div>
    );
  }

  return children;
}
