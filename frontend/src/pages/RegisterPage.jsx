import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Create Account</h1>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label>
            <span className="block text-sm text-slate-600 mb-1">Username</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
          <label>
            <span className="block text-sm text-slate-600 mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
          <label>
            <span className="block text-sm text-slate-600 mb-1">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              minLength={6}
            />
            <span className="text-xs text-slate-500 mt-1 block">Minimum 6 characters</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-slate-800 font-medium hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
