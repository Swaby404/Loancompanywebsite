import { Link } from 'react-router';
import { Mail, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import logo from 'figma:asset/e91ed6d83f2690a79935309cf8f1610c8d4c98b8.png';

export default function EmailSetup() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="max-w-4xl w-full mx-auto mt-12 mb-12 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Harvey's Loans" className="h-10" />
            </Link>
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Email Configuration</h1>
            <p className="text-gray-600">Set up email notifications for Harvey's Loans</p>
          </div>

          {/* Status Alert */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-semibold mb-1">Email Service Requires Configuration</p>
              <p className="text-yellow-700 text-sm">
                The Resend API key needs to be updated. Follow the steps below to configure email notifications.
              </p>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">Quick Setup Guide</h2>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Create a Resend Account</h3>
                      <p className="text-gray-600 mb-3">
                        If you don't have a Resend account yet, create one for free.
                      </p>
                      <a
                        href="https://resend.com/signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Sign Up for Resend
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Generate API Key</h3>
                      <p className="text-gray-600 mb-3">
                        Go to your Resend dashboard and create a new API key. Make sure to copy the entire key.
                      </p>
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Go to API Keys
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Add to Supabase</h3>
                      <p className="text-gray-600 mb-3">
                        Add your Resend API key to your Supabase project:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-3">
                        <li>Open your Supabase Dashboard</li>
                        <li>Go to <strong>Project Settings → Edge Functions</strong></li>
                        <li>Click on <strong>Manage secrets</strong></li>
                        <li>Find or add <code className="bg-gray-100 px-2 py-1 rounded text-sm">RESEND_API_KEY</code></li>
                        <li>Paste your API key and save</li>
                      </ol>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1"><strong>Secret Name:</strong></p>
                        <code className="text-sm bg-gray-800 text-green-400 px-3 py-1 rounded block">RESEND_API_KEY</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Test Email Functionality</h3>
                      <p className="text-gray-600 mb-3">
                        After adding the API key, test the email functionality by:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Creating a new user account (welcome email)</li>
                        <li>Requesting a password reset</li>
                        <li>Submitting a loan application</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-green-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Email Features Included
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-bold mb-2">📧 Welcome Emails</h3>
                  <p className="text-sm text-gray-600">Sent automatically when users sign up</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-bold mb-2">🔒 Password Reset</h3>
                  <p className="text-sm text-gray-600">Secure password reset links via email</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-bold mb-2">🔔 Application Alerts</h3>
                  <p className="text-sm text-gray-600">Notifications to Harveysloansllc@outlook.com</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-bold mb-2">✅ Status Updates</h3>
                  <p className="text-sm text-gray-600">Loan approval/rejection notifications</p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">📌 Important Notes</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>The system will continue to work even if email is not configured - emails will just be logged to the console instead</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Resend's free tier includes 100 emails per day and 3,000 emails per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>For production use, verify your domain in Resend to remove the "via resend.dev" label</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>All emails are sent from: Harvey's Loans &lt;onboarding@resend.dev&gt;</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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