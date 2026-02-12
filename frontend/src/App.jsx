import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ItemsPage from './pages/ItemsPage';
import StockInPage from './pages/StockInPage';
import StockOutPage from './pages/StockOutPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SuppliersPage from './pages/SuppliersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-md font-medium transition ${
        active ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {user && (
        <nav className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-xl font-bold text-slate-900">
                Inventory
              </Link>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/items">Items</NavLink>
              <NavLink to="/suppliers">Suppliers</NavLink>
              {user?.role && user.role !== 'USER' && (
                <NavLink to="/stock-in">Stock In</NavLink>
              )}
              <NavLink to="/stock-out">Stock Out</NavLink>
              {user?.role && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <NavLink to="/users">Users</NavLink>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Hello, {user.username}{user.role && ` (${user.role})`}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items"
            element={
              <ProtectedRoute>
                <ItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-in"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'VIEWER']}>
                <StockInPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/stock-out"
            element={
              <ProtectedRoute>
                <StockOutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <UsersPage />
              </RoleProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
