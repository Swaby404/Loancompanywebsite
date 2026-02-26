import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogOut, Plus, Home, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from 'figma:asset/e91ed6d83f2690a79935309cf8f1610c8d4c98b8.png';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Use Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }

      setUser(session.user);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/signin');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={logo} alt="Harvey's Loans" className="h-10" />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <span className="text-gray-700">
                {user?.user_metadata?.name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-600">Manage your loan applications and profile</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/loan-application"
            className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-indigo-500"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Plus className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  New Loan Application
                </h3>
                <p className="text-gray-600">
                  Start a new loan application and get approved quickly
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/loans"
            className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  My Loans
                </h3>
                <p className="text-gray-600">
                  Track balances, make payments, and view loan history
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Information Card */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            Ready to apply for a loan?
          </h3>
          <p className="text-indigo-800 mb-4">
            Our streamlined application process makes it easy to get the funds you need. 
            You'll need to provide proof of employment and a valid ID.
          </p>
          <Link
            to="/loan-application"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Start Application
          </Link>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <a href="tel:1-3459178564" className="text-gray-300 hover:text-white transition-colors">
              📞 1-345-917-8564
            </a>
            <span className="hidden md:inline text-gray-600">|</span>
            <a href="mailto:Harveysloansllc@outlook.com" className="text-gray-300 hover:text-white transition-colors">
              ✉️ Harveysloansllc@outlook.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}