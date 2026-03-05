import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload, CheckCircle, CreditCard, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';

declare global {
  interface ImportMeta {
    readonly env: Record<string, string>;
  }
}

export default function LoanApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    employer: '',
    jobTitle: '',
    monthlyIncome: '',
    employmentYears: '',
    loanAmount: '',
    loanPurpose: '',
    agreedToTerms: false,
  });

  // Document uploads
  const [employmentProof, setEmploymentProof] = useState<File | null>(null);
  const [employmentProofUrl, setEmploymentProofUrl] = useState('');
  const [idProof, setIdProof] = useState<File | null>(null);
  const [idProofUrl, setIdProofUrl] = useState('');
  const [uploadingEmployment, setUploadingEmployment] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);

  // Payment
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }

      setFormData(prev => ({
        ...prev,
        fullName: session.user.user_metadata?.name || '',
        email: session.user.email || '',
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error checking user session:', error);
      navigate('/signin');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEmploymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEmploymentProof(file);
    setUploadingEmployment(true);
    setError('');

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('documentType', 'employment_proof');

      const { data, ok, error: fetchError, retryAfterSeconds } = await authFetch('/upload', {
        method: 'POST',
        body: uploadForm,
      });

      if (!ok) {
        const msg = retryAfterSeconds
          ? `Too many upload attempts. Please wait ${retryAfterSeconds} seconds.`
          : data?.error || fetchError || 'Failed to upload document';
        console.error('Error uploading employment proof document:', msg);
        setError(msg);
        setUploadingEmployment(false);
        return;
      }

      setEmploymentProofUrl(data.url);
      setUploadingEmployment(false);
    } catch (err) {
      console.error('Error uploading employment proof:', err);
      setError('Failed to upload document. Please try again.');
      setUploadingEmployment(false);
    }
  };

  const handleIdProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdProof(file);
    setUploadingId(true);
    setError('');

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('documentType', 'id_verification');

      const { data, ok, error: fetchError, retryAfterSeconds } = await authFetch('/upload', {
        method: 'POST',
        body: uploadForm,
      });

      if (!ok) {
        const msg = retryAfterSeconds
          ? `Too many upload attempts. Please wait ${retryAfterSeconds} seconds.`
          : data?.error || fetchError || 'Failed to upload document';
        console.error('Error uploading ID verification document:', msg);
        setError(msg);
        setUploadingId(false);
        return;
      }

      setIdProofUrl(data.url);
      setUploadingId(false);
    } catch (err) {
      console.error('Error uploading ID proof:', err);
      setError('Failed to upload document. Please try again.');
      setUploadingId(false);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    setError('');

    try {
      // Create payment intent for application fee ($50)
      const { data, ok, error: fetchError } = await authFetch('/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ amount: 50 }),
      });

      if (!ok) {
        console.error('Error creating payment intent for application fee:', data?.error || fetchError);
        setError(data?.error || fetchError || 'Failed to process payment');
        setProcessingPayment(false);
        return;
      }

      // For demo purposes, we'll simulate payment success
      // In production, you would use Stripe Elements for actual payment
      setTimeout(() => {
        setPaymentComplete(true);
        setProcessingPayment(false);
      }, 2000);

    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setError('');

    try {
      const { data, ok, error: fetchError } = await authFetch('/loan-applications', {
        method: 'POST',
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          employer: formData.employer,
          jobTitle: formData.jobTitle,
          monthlyIncome: parseFloat(formData.monthlyIncome),
          annualIncome: parseFloat(formData.monthlyIncome) * 12,
          employmentYears: parseFloat(formData.employmentYears),
          employmentStatus: 'employed',
          loanAmount: parseFloat(formData.loanAmount),
          loanPurpose: formData.loanPurpose,
          proofOfEmployment: employmentProofUrl,
          idDocument: idProofUrl,
          dateOfBirth: '1990-01-01',
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!ok) {
        console.error('Error submitting loan application:', data?.error || fetchError);
        setError(data?.error || fetchError || 'Failed to submit application');
        setSubmitting(false);
        return;
      }

      console.log('✅ Loan application submitted successfully:', data.application.applicationId);
      
      // Success - redirect to dashboard
      alert('Application submitted successfully! We will review your application and contact you within 24-48 hours.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };

  const canProceedToStep2 = () => {
    return formData.fullName && formData.phone && formData.address && 
           formData.city && formData.state && formData.zipCode;
  };

  const canProceedToStep3 = () => {
    return formData.employer && formData.jobTitle && formData.monthlyIncome && 
           formData.employmentYears && employmentProofUrl;
  };

  const canProceedToStep4 = () => {
    return formData.loanAmount && formData.loanPurpose && formData.agreedToTerms && idProofUrl;
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                aria-label="Go back to dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                 
              </div>
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

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= stepNum ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <CheckCircle className="w-6 h-6" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > stepNum ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>Personal Info</span>
            <span className={step >= 2 ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>Employment</span>
            <span className={step >= 3 ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>Loan Details</span>
            <span className={step >= 4 ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    title="Full Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    title="Phone Number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  title="Street Address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    title="City"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    title="State"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    title="ZIP Code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2()}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Employment
              </button>
            </div>
          )}

          {/* Step 2: Employment Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Employment Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employer Name *
                  </label>
                  <input
                    type="text"
                    name="employer"
                    value={formData.employer}
                    onChange={handleInputChange}
                    required
                    title="Employer Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    required
                    title="Job Title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Income *
                  </label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                    required
                    title="Monthly Income"
                    placeholder="5000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years at Current Job *
                  </label>
                  <input
                    type="number"
                    name="employmentYears"
                    value={formData.employmentYears}
                    onChange={handleInputChange}
                    required
                    title="Years at Current Job"
                    placeholder="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof of Employment *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a recent pay stub, employment letter, or tax document
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {employmentProof ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">{employmentProof.name}</p>
                      {uploadingEmployment && <p className="text-sm text-gray-500">Uploading...</p>}
                      {employmentProofUrl && <p className="text-sm text-green-600">Uploaded successfully</p>}
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <label className="cursor-pointer">
                        <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                          Choose file
                        </span>
                        <input
                          type="file"
                          onChange={handleEmploymentProofUpload}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3()}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Loan Details
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Loan Details & Agreement */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Loan Details & Agreement</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount *
                  </label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    required
                    title="Loan Amount"
                    placeholder="10000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Purpose *
                  </label>
                  <select
                    name="loanPurpose"
                    value={formData.loanPurpose}
                    onChange={handleInputChange}
                    required
                    title="Loan Purpose"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select purpose</option>
                    <option value="home">Home Improvement</option>
                    <option value="car">Vehicle Purchase</option>
                    <option value="debt">Debt Consolidation</option>
                    <option value="business">Business</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Verification *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a government-issued ID (driver's license, passport, etc.)
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {idProof ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">{idProof.name}</p>
                      {uploadingId && <p className="text-sm text-gray-500">Uploading...</p>}
                      {idProofUrl && <p className="text-sm text-green-600">Uploaded successfully</p>}
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <label className="cursor-pointer">
                        <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                          Choose file
                        </span>
                        <input
                          type="file"
                          onChange={handleIdProofUpload}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-64 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-3">Loan Agreement Terms</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <strong>1. Loan Terms:</strong> By accepting this loan, you agree to repay the principal amount 
                    plus interest according to the payment schedule provided upon approval.
                  </p>
                  <p>
                    <strong>2. Interest Rate:</strong> Interest rates are determined based on creditworthiness, 
                    loan amount, and term length. Rates range from 5.99% to 24.99% APR.
                  </p>
                  <p>
                    <strong>3. Repayment:</strong> Monthly payments are due on the same day each month. 
                    Late payments may incur fees and affect your credit score.
                  </p>
                  <p>
                    <strong>4. Early Repayment:</strong> You may repay your loan early without penalty fees.
                  </p>
                  <p>
                    <strong>5. Default:</strong> Failure to make payments may result in collection actions 
                    and negative credit reporting.
                  </p>
                  <p>
                    <strong>6. Privacy:</strong> Your personal information will be kept confidential and 
                    used only for loan processing and servicing.
                  </p>
                  <p>
                    <strong>7. Credit Check:</strong> By submitting this application, you authorize us to 
                    obtain your credit report and verify your employment and income.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="agreedToTerms" className="text-sm text-gray-700">
                  I have read and agree to the loan agreement terms and conditions. I certify that all 
                  information provided is true and accurate to the best of my knowledge.
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!canProceedToStep4()}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Fee</h2>
              
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-indigo-900">Application Processing Fee</h3>
                    <p className="text-sm text-indigo-700">One-time fee to process your application</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-indigo-900">$50.00</div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Application Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loan Amount:</span>
                    <span className="font-medium">${formData.loanAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purpose:</span>
                    <span className="font-medium capitalize">{formData.loanPurpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="font-medium">${formData.monthlyIncome}</span>
                  </div>
                </div>
              </div>

              {!paymentComplete ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Click below to process the application fee. For this demo, payment will be simulated.
                    In production, you would integrate Stripe Elements for actual payment processing.
                  </p>
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={processingPayment}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay $50.00
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-green-900 mb-2">Payment Successful</h3>
                    <p className="text-green-700">Your application fee has been processed</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              )}

              {!paymentComplete && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Back
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-12 bg-gray-900 text-white py-8">
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