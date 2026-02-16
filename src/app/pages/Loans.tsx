import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Home, DollarSign, Calendar, TrendingUp, CreditCard, ChevronRight } from 'lucide-react';
import { supabase, API_URL } from '../lib/supabase';
import { publicAnonKey } from '/utils/supabase/info';
import logo from 'figma:asset/e91ed6d83f2690a79935309cf8f1610c8d4c98b8.png';

interface Loan {
  id: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  totalAmount: number;
  status: string;
  startDate: string;
  nextPaymentDate: string;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
}

export default function Loans() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthAndFetchLoans();
  }, []);

  const checkAuthAndFetchLoans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }

      setAccessToken(session.access_token);
      await fetchLoans(session.access_token);
    } catch (error) {
      console.error('Error checking authentication:', error);
      navigate('/signin');
    }
  };

  const fetchLoans = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/loans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching loans:', data.error);
        setError(data.error || 'Failed to fetch loans');
        setLoading(false);
        return;
      }

      setLoans(data.loans || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to fetch loans. Please try again.');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paid_off':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalBalance = () => {
    return loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  };

  const getTotalMonthlyPayment = () => {
    return loans
      .filter(loan => loan.status === 'active')
      .reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <img src={logo} alt="Harvey's Loans" className="h-10" />
              </button>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Loans</h1>
          <p className="text-gray-600">Track and manage your loan balances and payments</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {loans.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Balance</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(getTotalBalance())}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Monthly Payment</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(getTotalMonthlyPayment())}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Active Loans</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {loans.filter(l => l.status === 'active').length}
              </p>
            </div>
          </div>
        )}

        {/* Loans List */}
        {loans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Loans</h3>
            <p className="text-gray-600 mb-6">
              You don't have any active loans yet. Apply for a loan to get started.
            </p>
            <button
              onClick={() => navigate('/loan-application')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Apply for a Loan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/loans/${loan.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {formatCurrency(loan.principal)} Loan
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                        {loan.status === 'paid_off' ? 'Paid Off' : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Started {formatDate(loan.startDate)} • {loan.interestRate}% APR • {loan.termMonths} months
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Remaining Balance</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.remainingBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Next Payment</p>
                    <p className="text-sm font-medium text-gray-900">
                      {loan.status === 'active' ? formatDate(loan.nextPaymentDate) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Payment</p>
                    <p className="text-sm font-medium text-gray-900">
                      {loan.lastPaymentDate ? formatCurrency(loan.lastPaymentAmount!) : 'None'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(((loan.totalAmount - loan.remainingBalance) / loan.totalAmount) * 100)}% paid</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${((loan.totalAmount - loan.remainingBalance) / loan.totalAmount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
