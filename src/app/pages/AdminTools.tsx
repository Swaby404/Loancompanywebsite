import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Home, CheckCircle } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import logo from 'figma:asset/e91ed6d83f2690a79935309cf8f1610c8d4c98b8.png';

export default function AdminTools() {
  const navigate = useNavigate();
  const [applicationId, setApplicationId] = useState('');
  const [interestRate, setInterestRate] = useState('12.99');
  const [termMonths, setTermMonths] = useState('36');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApproveLoan = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResult('');
    setProcessing(true);

    try {
      const { data, ok, error: fetchError } = await authFetch(`/admin/approve-loan/${applicationId}`, {
        method: 'POST',
        body: JSON.stringify({
          interestRate: parseFloat(interestRate),
          termMonths: parseInt(termMonths),
        }),
      });

      if (!ok) {
        console.error('Error approving loan:', data?.error || fetchError);
        setError(data?.error || fetchError || 'Failed to approve loan');
      } else {
        setResult(`Loan approved successfully! Loan ID: ${data.loan.id}`);
        setApplicationId('');
      }
    } catch (err) {
      console.error('Error approving loan:', err);
      setError('Failed to approve loan. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Harvey's Loans" className="h-10" />
              <h1 className="text-xl font-bold text-gray-900">Admin Tools</h1>
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
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-yellow-800 text-sm">
            <strong>Demo Tool:</strong> This page allows you to approve loan applications and create active loans for testing purposes.
            In production, this would be a secure admin panel with proper authentication.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 text-sm">{result}</p>
            </div>
          </div>
        )}

        {/* Approve Loan Form */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Approve Loan Application</h2>
          
          <form onSubmit={handleApproveLoan} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application ID *
              </label>
              <input
                type="text"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                required
                placeholder="Enter application ID from email notification"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Copy the Application ID from the email notification sent to Harveysloansllc@outlook.com
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (APR) *
                </label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  step="0.01"
                  min="0"
                  max="30"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">Percentage (e.g., 12.99 for 12.99% APR)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term (Months) *
                </label>
                <select
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Approve Loan & Create Active Loan'}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600">1.</span>
              <span>A user submits a loan application through the regular application form</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600">2.</span>
              <span>You receive an email at Harveysloansllc@outlook.com with all application details</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600">3.</span>
              <span>Copy the Application ID from the email</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600">4.</span>
              <span>Paste it into the form above and set the interest rate and term</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600">5.</span>
              <span>Click "Approve Loan" to create an active loan for the user</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600">6.</span>
              <span>The user can now see their loan in the "My Loans" section and make payments</span>
            </li>
          </ol>
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