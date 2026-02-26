import { useState } from 'react';
import { AlertCircle, CheckCircle, Mail, Key, ExternalLink } from 'lucide-react';

export function EmailSetupGuide() {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testEmailService = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Test by sending a simple request to the server
      // The server will log whether email succeeds or fails
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Test <onboarding@resend.dev>',
          to: ['swabyoliver@gmail.com'],
          subject: 'Test Email - Harvey\'s Loans',
          html: '<p>This is a test email from Harvey\'s Loans to verify your Resend API key.</p>',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: `✅ Success! Test email sent to swabyoliver@gmail.com. Message ID: ${data.id}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Error: ${data.message || 'Failed to send email'}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">Email Service Setup Guide</h1>
            </div>
            <p className="text-indigo-100 mt-2">Configure Resend API for Harvey's Loans</p>
          </div>

          {/* Alert */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 m-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-yellow-800 font-bold">Resend API Key Required</h3>
                <p className="text-yellow-700 mt-1">
                  The current API key is invalid or has expired. Follow the steps below to configure a valid key.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="px-8 py-6 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Setup Instructions</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Create a Resend Account</h3>
                    <p className="text-gray-600 mb-2">
                      If you don't have a Resend account yet, sign up for free:
                    </p>
                    <a
                      href="https://resend.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Sign up at resend.com
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Generate an API Key</h3>
                    <p className="text-gray-600 mb-2">
                      Once logged in, navigate to the API Keys section and create a new key:
                    </p>
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Go to API Keys
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <strong>Note:</strong> API keys start with <code className="bg-gray-200 px-2 py-0.5 rounded">re_</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Add Key to Supabase</h3>
                    <p className="text-gray-600 mb-3">
                      Add the API key as an environment variable in your Supabase project:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Navigate to Project Settings → Edge Functions</li>
                      <li>Add a new secret named: <code className="bg-gray-200 px-2 py-0.5 rounded">RESEND_API_KEY</code></li>
                      <li>Paste your Resend API key as the value</li>
                      <li>Save and redeploy your edge functions</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Test Your Configuration</h3>
                    <p className="text-gray-600 mb-3">
                      Use the form below to test if your API key is working correctly:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Key className="inline w-4 h-4 mr-1" />
                        Resend API Key
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="re_xxxxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                      />
                      <button
                        onClick={testEmailService}
                        disabled={!apiKey || testing}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {testing ? 'Testing...' : 'Test API Key'}
                      </button>
                      
                      {testResult && (
                        <div className={`mt-4 p-4 rounded-lg border ${
                          testResult.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            {testResult.success ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <p className={`text-sm ${
                              testResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {testResult.message}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">✨ Email Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 mb-2">Welcome Emails</h3>
                  <p className="text-sm text-indigo-700">Automatically sent when new users sign up</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Password Reset</h3>
                  <p className="text-sm text-purple-700">Secure password reset links with 1-hour expiry</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Loan Notifications</h3>
                  <p className="text-sm text-green-700">Application updates sent to admins</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Testing Credentials</h3>
                  <p className="text-sm text-blue-700">All credentials sent to swabyoliver@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Graceful Degradation */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Important Notes</h2>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <ul className="space-y-2 text-blue-900">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>The application will continue to work even if emails fail to send</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>All email content is logged to the console for debugging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Testing mode redirects all emails to swabyoliver@gmail.com</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Free Resend accounts can send up to 3,000 emails per month</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-center text-gray-600 text-sm">
              Need help? Visit the{' '}
              <a
                href="https://resend.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Resend Documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
