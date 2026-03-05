import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Lock, User, Home, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { publicFetch } from '../lib/authFetch';
 
 

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initialize admin user on mount
  useEffect(() => {
    const initAdmin = async () => {
      try {
        await publicFetch('/admin/init', { method: 'POST' });
        console.log('✅ Admin initialization complete');
      } catch (error) {
        console.error('Admin initialization error:', error);
      } finally {
        setInitializing(false);
      }
    };

    initAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Strict admin email check BEFORE attempting sign in
      if (username.toLowerCase() !== 'harveysloansllc@outlook.com') {
        setError('⛔ Access Denied: Only Harveysloansllc@outlook.com can access this portal');
        setLoading(false);
        return;
      }

      // Verify password matches expected admin password
      if (password !== '!995!993') {
        setError('Invalid admin credentials');
        setLoading(false);
        return;
      }

      // Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (signInError || !data.session) {
        setError('Invalid credentials. Please check your email and password.');
        setLoading(false);
        return;
      }

      // Triple-check admin email (extra security layer)
      if (data.user.email?.toLowerCase() !== 'harveysloansllc@outlook.com') {
        setError('⛔ Access Denied: This account does not have admin privileges');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log(`✅ Admin authenticated successfully: ${username}`);
      
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Failed to login. Please try again.');
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing admin portal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
           
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-600 mt-2">Secure Access Only</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            This is a secure admin portal. Unauthorized access is prohibited.
          </p>
        </div>

        {/* Admin Credentials Info - remove and replace with security notice */}
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-700 text-center">
            Access restricted to authorized Harvey's Loans administrators only.
          </p>
        </div>

        {/* Home Link */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            <Home className="inline-block mr-1 w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}