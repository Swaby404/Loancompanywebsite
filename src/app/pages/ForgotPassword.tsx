import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Home, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, KeyRound, Send, ShieldCheck, Hash } from 'lucide-react';
import { publicFetch } from '../lib/authFetch';
 

type ResetMethod = null | 'onsite' | 'link' | 'temp';
type OnsiteStep = 'email' | 'code' | 'password' | 'done';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<ResetMethod>(null);

  // Shared
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // On-site flow
  const [onsiteStep, setOnsiteStep] = useState<OnsiteStep>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Method 1: On-site reset (code + new password) ──

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, ok } = await publicFetch('/forgot-password-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!ok) {
        setError(data?.retryAfterSeconds
          ? `Too many requests. Please wait ${data.retryAfterSeconds} seconds.`
          : data?.error || 'Failed to send code');
        setLoading(false);
        return;
      }

      setOnsiteStep('code');
    } catch (err) {
      setError('Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, ok } = await publicFetch('/verify-code-reset', {
        method: 'POST',
        body: JSON.stringify({ email, code: verificationCode, newPassword }),
      });

      if (!ok) {
        setError(data?.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setOnsiteStep('done');
      setSuccessMessage(data?.message || 'Password reset successful!');
      setTimeout(() => navigate('/signin'), 4000);
    } catch (err) {
      setError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Method 2: Email reset link ──

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, ok } = await publicFetch('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!ok) {
        setError(data?.retryAfterSeconds
          ? `Too many requests. Please wait ${data.retryAfterSeconds} seconds.`
          : data?.error || 'Failed to send reset link');
        setLoading(false);
        return;
      }

      setSuccessMessage('If an account exists with this email, you will receive a password reset link shortly.');
    } catch (err) {
      setError('Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // ── Method 3: Temp password ──

  const handleSendTempPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, ok } = await publicFetch('/forgot-password-temp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!ok) {
        setError(data?.retryAfterSeconds
          ? `Too many requests. Please wait ${data.retryAfterSeconds} seconds.`
          : data?.error || 'Failed to send temporary password');
        setLoading(false);
        return;
      }

      setSuccessMessage('If an account exists with this email, a temporary password has been sent. Check your inbox.');
    } catch (err) {
      setError('Failed to send temporary password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset to choose a different method ──
  const handleBack = () => {
    setMethod(null);
    setError('');
    setSuccessMessage('');
    setOnsiteStep('email');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // ── Shared header ──
  const Header = () => (
    <div className="flex items-center justify-between mb-8">
      <Link to="/" className="flex items-center gap-2">
       
      </Link>
      <Link to="/" className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
        <Home className="w-4 h-4" />
        <span className="text-sm">Home</span>
      </Link>
    </div>
  );

  // ── On-site reset: done state ──
  if (method === 'onsite' && onsiteStep === 'done') {
    return (
      <Shell>
        <Header />
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Password Reset Successful</h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          <p className="text-sm text-gray-500 mb-4">Redirecting to sign in...</p>
          <Link to="/signin" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
            Go to Sign In
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Link / temp password success ──
  if ((method === 'link' || method === 'temp') && successMessage) {
    return (
      <Shell>
        <Header />
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {method === 'link' ? 'Check Your Email' : 'Temporary Password Sent'}
          </h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>

          {method === 'link' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 font-medium">Next steps:</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset password link (valid for 1 hour)</li>
                <li>Choose a new password</li>
              </ul>
            </div>
          )}

          {method === 'temp' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-amber-800 font-medium">Next steps:</p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                <li>Check your email for the temporary password</li>
                <li>Sign in using the temporary password</li>
                <li>We recommend changing it after signing in</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Link to="/signin" className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm">
              Go to Sign In
            </Link>
            <button onClick={handleBack} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Try a different method
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Method selection screen ──
  if (!method) {
    return (
      <Shell>
        <Header />
        <h2 className="text-3xl font-bold text-center mb-2">Reset Password</h2>
        <p className="text-gray-600 text-center mb-8">Choose how you'd like to reset your password</p>

        <div className="space-y-4">
          {/* Option 1: Reset on this page */}
          <button
            onClick={() => setMethod('onsite')}
            className="w-full flex items-start gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left group"
          >
            <div className="shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <KeyRound className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Reset on this page</h3>
              <p className="text-sm text-gray-500 mt-1">
                We'll email you a 6-digit code. Enter it here and choose your new password — no need to leave this page.
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Recommended
              </span>
            </div>
          </button>

          {/* Option 2: Email a reset link */}
          <button
            onClick={() => setMethod('link')}
            className="w-full flex items-start gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Email me a reset link</h3>
              <p className="text-sm text-gray-500 mt-1">
                We'll send a link to your email. Click it to open a page where you can set a new password.
              </p>
            </div>
          </button>

          {/* Option 3: Email a temporary password */}
          <button
            onClick={() => setMethod('temp')}
            className="w-full flex items-start gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/50 transition-all text-left group"
          >
            <div className="shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Mail className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Email me a temporary password</h3>
              <p className="text-sm text-gray-500 mt-1">
                We'll generate a secure temporary password and email it to you. Use it to sign in right away.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link to="/signin" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </Shell>
    );
  }

  // ── On-site flow: enter email → enter code → enter new password ──
  if (method === 'onsite') {
    return (
      <Shell>
        <Header />

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Email', 'Verify Code', 'New Password'].map((label, i) => {
            const stepIndex = i === 0 ? 'email' : i === 1 ? 'code' : 'password';
            const stepOrder = ['email', 'code', 'password'] as OnsiteStep[];
            const currentIndex = stepOrder.indexOf(onsiteStep);
            const isActive = i === currentIndex;
            const isDone = i < currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 ${isDone ? 'bg-indigo-600' : 'bg-gray-300'}`} />}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-indigo-600 text-white' : isActive ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'text-indigo-700 font-semibold' : 'text-gray-500'}`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Enter email */}
        {onsiteStep === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-1">Enter Your Email</h2>
            <p className="text-gray-500 text-center text-sm mb-4">We'll send a 6-digit verification code to your inbox.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
            <button type="button" onClick={handleBack} className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Choose a different method
            </button>
          </form>
        )}

        {/* Step 2: Enter code */}
        {onsiteStep === 'code' && (
          <form onSubmit={(e) => { e.preventDefault(); setError(''); setOnsiteStep('password'); }} className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-1">Enter Verification Code</h2>
            <p className="text-gray-500 text-center text-sm mb-4">
              We sent a 6-digit code to <strong>{email}</strong>. Check your inbox (and spam).
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required maxLength={6} pattern="\d{6}" inputMode="numeric"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="------"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Code expires in 15 minutes. 5 attempts maximum.</p>
            </div>
            <button type="submit" disabled={verificationCode.length !== 6}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              Continue
            </button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setOnsiteStep('email')} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="button" onClick={handleSendCode} disabled={loading} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                {loading ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set new password */}
        {onsiteStep === 'password' && (
          <form onSubmit={handleVerifyAndReset} className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-1">Create New Password</h2>
            <p className="text-gray-500 text-center text-sm mb-4">Choose a strong new password for your account.</p>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs text-indigo-700">
                <strong>Code verified:</strong> {verificationCode} for {email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  required minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  required minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Re-enter new password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password strength hints */}
            <div className="space-y-1">
              <PasswordCheck label="At least 6 characters" pass={newPassword.length >= 6} />
              <PasswordCheck label="Passwords match" pass={newPassword.length > 0 && newPassword === confirmPassword} />
            </div>

            <button type="submit" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => setOnsiteStep('code')} className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to code entry
            </button>
          </form>
        )}
      </Shell>
    );
  }

  // ── Link method form ──
  if (method === 'link') {
    return (
      <Shell>
        <Header />
        <h2 className="text-2xl font-bold text-center mb-1">Email Reset Link</h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          We'll send a password reset link to your email address. The link is valid for 1 hour.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSendLink} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <button onClick={handleBack} className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Choose a different method
        </button>
      </Shell>
    );
  }

  // ── Temp password form ──
  if (method === 'temp') {
    return (
      <Shell>
        <Header />
        <h2 className="text-2xl font-bold text-center mb-1">Email Temporary Password</h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          We'll generate a secure temporary password and send it to your email. Use it to sign in immediately.
        </p>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Your current password will be replaced. After signing in with the temporary password, we recommend changing it.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSendTempPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Generating...' : 'Send Temporary Password'}
          </button>
        </form>
        <button onClick={handleBack} className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Choose a different method
        </button>
      </Shell>
    );
  }

  return null;
}

// ── Helper components ──

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="max-w-md w-full mx-auto mt-10 mb-10 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>
      </div>
      <footer className="mt-auto bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <a href="tel:1-3459178564" className="text-gray-300 hover:text-white transition-colors">1-345-917-8564</a>
            <span className="hidden md:inline text-gray-600">|</span>
            <a href="mailto:Harveysloansllc@outlook.com" className="text-gray-300 hover:text-white transition-colors">Harveysloansllc@outlook.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PasswordCheck({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${pass ? 'bg-green-100' : 'bg-gray-100'}`}>
        {pass ? <CheckCircle className="w-3 h-3 text-green-600" /> : <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />}
      </div>
      <span className={pass ? 'text-green-700' : 'text-gray-500'}>{label}</span>
    </div>
  );
}
