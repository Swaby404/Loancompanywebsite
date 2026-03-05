import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, CreditCard, CheckCircle, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';
import '../loandetail.css';

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

interface Payment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  status: string;
}

export default function LoanDetail() {
  const navigate = useNavigate();
  const { loanId } = useParams();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, [loanId]);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }

      await fetchLoanDetails();
      await fetchPaymentHistory();
    } catch (error) {
      console.error('Error checking authentication:', error);
      navigate('/signin');
    }
  };

  const fetchLoanDetails = async () => {
    try {
      const { data, ok, error: fetchError } = await authFetch(`/loans/${loanId}`);

      if (!ok) {
        console.error('Error fetching loan details:', data?.error || fetchError);
        setError(data?.error || fetchError || 'Failed to fetch loan details');
        setLoading(false);
        return;
      }

      setLoan(data.loan);
      setPaymentAmount(data.loan.monthlyPayment.toString());
    } catch (err) {
      console.error('Error fetching loan details:', err);
      setError('Failed to fetch loan details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const { data, ok } = await authFetch(`/loans/${loanId}/payments`);

      if (ok) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
    }
  };

  const handleMakePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount');
      setProcessing(false);
      return;
    }

    if (loan && amount > loan.remainingBalance) {
      setError('Payment amount cannot exceed remaining balance');
      setProcessing(false);
      return;
    }

    try {
      const { data, ok, error: fetchError } = await authFetch(`/loans/${loanId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });

      if (!ok) {
        console.error('Error making payment:', data?.error || fetchError);
        setError(data?.error || fetchError || 'Failed to process payment');
        setProcessing(false);
        return;
      }

      // Update loan and payments
      setLoan(data.loan);
      await fetchPaymentHistory();
      setShowPaymentForm(false);
      setPaymentAmount(data.loan.monthlyPayment.toString());
      alert('Payment processed successfully!');
    } catch (err) {
      console.error('Error making payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
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
        return 'status-active';
      case 'paid_off':
        return 'status-paid-off';
      case 'late':
        return 'status-late';
      default:
        return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="text-gray-600">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Loan not found</p>
          <button
            type="button"
            onClick={() => navigate('/loans')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Back to Loans
          </button>
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
                type="button"
                onClick={() => navigate('/loans')}
                title="Go back to loans"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img src="/logo.png" alt="Harvey's Loans" className="h-10" />
            </div>
            <button
              type="button"
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loan Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(loan.principal)} Loan
              </h1>
              <p className="text-gray-600">
                Started {formatDate(loan.startDate)} • {loan.interestRate}% APR • {loan.termMonths} months
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(loan.status)}`}>
              {loan.status === 'paid_off' ? 'Paid Off' : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
            </span>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Remaining Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.remainingBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Payment</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.monthlyPayment)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Next Payment Due</p>
              <p className="text-lg font-medium text-gray-900">
                {loan.status === 'active' ? formatDate(loan.nextPaymentDate) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.totalAmount)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Loan Progress</span>
              <span>{Math.round(((loan.totalAmount - loan.remainingBalance) / loan.totalAmount) * 100)}% paid</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${((loan.totalAmount - loan.remainingBalance) / loan.totalAmount) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Payment Button */}
          {loan.status === 'active' && !showPaymentForm && (
            <button
              type="button"
              onClick={() => setShowPaymentForm(true)}
              className="btn-make-payment"
            >
              <CreditCard className="w-5 h-5" />
              Make a Payment
            </button>
          )}

          {/* Payment Form */}
          {showPaymentForm && loan.status === 'active' && (
            <form onSubmit={handleMakePayment} className="payment-form">
              <h3 className="text-lg font-semibold text-gray-900">Make a Payment</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  max={loan.remainingBalance}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(loan.monthlyPayment.toString())}
                    className="btn-quick-amount"
                  >
                    Monthly Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(loan.remainingBalance.toString())}
                    className="btn-quick-amount"
                  >
                    Pay in Full
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Note: This is a demo. In production, this would integrate with Stripe for actual payment processing.
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-submit-payment"
                >
                  {processing ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Payment Schedule */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Schedule</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: loan.termMonths }, (_, i) => {
                  const dueDate = new Date(loan.startDate);
                  dueDate.setMonth(dueDate.getMonth() + i + 1);
                  const isPaid = payments.filter(p => p.status === 'completed').length > i;
                  
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">Payment {i + 1}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{formatDate(dueDate.toISOString())}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {formatCurrency(loan.monthlyPayment)}
                      </td>
                      <td className="py-3 px-4">
                        {isPaid ? (
                          <span className="status-badge status-paid">
                            <CheckCircle className="w-3 h-3" />
                            Paid
                          </span>
                        ) : dueDate < new Date() ? (
                          <span className="status-badge status-overdue">
                            Overdue
                          </span>
                        ) : (
                          <span className="status-badge status-pending">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>
          
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No payments made yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="payment-icon">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                  <span className="status-badge status-completed">
                    {payment.status === 'completed' ? 'Completed' : payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
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