import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  LogOut, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Home,
  TrendingUp,
  AlertCircle,
  Activity,
  XCircle,
  Search,
  RefreshCw,
  CreditCard,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronDown,
  ChevronUp,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';
 
 

interface EnrichedApplication {
  id: string;
  applicationId: string;
  userId: string;
  fullName: string;
  userName: string;
  userEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  employer: string;
  jobTitle: string;
  monthlyIncome: string;
  employmentYears: string;
  loanAmount: number;
  loanPurpose: string;
  status: string;
  createdAt: string;
  submittedAt: string;
  approvedAt?: string;
  deniedAt?: string;
  denialReason?: string;
  employmentProofUrl?: string;
  idProofUrl?: string;
  totalPaid: number;
  paymentCount: number;
  currentBalance: number;
  interestAccrued: number;
  remainingBalance: number;
  loanId?: string;
  interestRate?: number;
  termMonths?: number;
}

interface Payment {
  paymentId: string;
  applicationId: string;
  userId: string;
  amount: number;
  paidAt: string;
  userName: string;
  userEmail: string;
  loanAmount: number;
  loanPurpose: string;
  applicationStatus: string;
}

interface BusinessOverview {
  totalLoansOutstanding: number;
  totalPrincipalDisbursed: number;
  totalInterestAccrued: number;
  averageLoanSize: number;
  activeLoansCount: number;
  pendingApplicationsCount: number;
  deniedApplicationsCount: number;
  totalApplicationsCount: number;
}

type TabType = 'pending' | 'active' | 'denied' | 'all' | 'payments';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<EnrichedApplication | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Approve form
  const [interestRate, setInterestRate] = useState('30');
  const [termMonths, setTermMonths] = useState('12');
  const [approving, setApproving] = useState(false);

  // Deny form
  const [denialReason, setDenialReason] = useState('');
  const [denying, setDenying] = useState(false);
  const [showDenyForm, setShowDenyForm] = useState(false);

  const [businessOverview, setBusinessOverview] = useState<BusinessOverview>({
    totalLoansOutstanding: 0,
    totalPrincipalDisbursed: 0,
    totalInterestAccrued: 0,
    averageLoanSize: 0,
    activeLoansCount: 0,
    pendingApplicationsCount: 0,
    deniedApplicationsCount: 0,
    totalApplicationsCount: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Verify admin access first
      const verifyResult = await authFetch('/admin/verify', { redirectOn401: true });
      if (!verifyResult.ok) {
        navigate('/admin/login');
        return;
      }

      // Fetch enriched applications, payments, and overview in parallel
      const [appsResult, paymentsResult, overviewResult] = await Promise.all([
        authFetch<{ applications: EnrichedApplication[] }>('/admin/applications-enriched'),
        authFetch<{ payments: Payment[] }>('/admin/payments'),
        authFetch<{ overview: BusinessOverview }>('/admin/business-overview'),
      ]);

      if (appsResult.ok && appsResult.data) {
        const sorted = (appsResult.data.applications || []).sort(
          (a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime()
        );
        setApplications(sorted);
      }

      if (paymentsResult.ok && paymentsResult.data) {
        setPayments(paymentsResult.data.payments || []);
      }

      if (overviewResult.ok && overviewResult.data) {
        setBusinessOverview(overviewResult.data.overview);
      }

      setLoading(false);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setApproving(true);
    setError('');

    try {
      const { data, ok, error: fetchError, retryAfterSeconds } = await authFetch(`/admin/approve-loan/${selectedApp.applicationId || selectedApp.id}`, {
        method: 'POST',
        body: JSON.stringify({
          interestRate: parseFloat(interestRate),
          termMonths: parseInt(termMonths),
        }),
      });

      if (!ok) {
        const msg = retryAfterSeconds
          ? `Rate limit reached. Please wait ${retryAfterSeconds} seconds and try again.`
          : data?.error || fetchError || 'Failed to approve loan';
        setError(msg);
        return;
      }

      setSuccessMessage(`Loan approved! ID: ${data.loan.id}`);
      setSelectedApp(null);
      setInterestRate('30');
      setTermMonths('12');
      setTimeout(() => { loadDashboard(); setSuccessMessage(''); }, 2000);
    } catch (err) {
      console.error('Approve error:', err);
      setError('Failed to approve loan');
    } finally {
      setApproving(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedApp) return;
    setDenying(true);
    setError('');

    try {
      const { data, ok, error: fetchError, retryAfterSeconds } = await authFetch(`/admin/deny-loan/${selectedApp.applicationId || selectedApp.id}`, {
        method: 'POST',
        body: JSON.stringify({ reason: denialReason }),
      });

      if (!ok) {
        const msg = retryAfterSeconds
          ? `Rate limit reached. Please wait ${retryAfterSeconds} seconds and try again.`
          : data?.error || fetchError || 'Failed to deny loan';
        setError(msg);
        return;
      }

      setSuccessMessage('Application denied successfully.');
      setSelectedApp(null);
      setDenialReason('');
      setShowDenyForm(false);
      setTimeout(() => { loadDashboard(); setSuccessMessage(''); }, 2000);
    } catch (err) {
      console.error('Deny error:', err);
      setError('Failed to deny loan');
    } finally {
      setDenying(false);
    }
  };

  // Filtering
  const filterBySearch = (items: any[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item: any) =>
      (item.fullName || item.userName || '').toLowerCase().includes(q) ||
      (item.userEmail || '').toLowerCase().includes(q) ||
      (item.applicationId || item.id || '').toLowerCase().includes(q) ||
      (item.phone || '').includes(q)
    );
  };

  const pendingApps = filterBySearch(applications.filter(a => a.status === 'pending'));
  const activeApps = filterBySearch(applications.filter(a => a.status === 'approved'));
  const deniedApps = filterBySearch(applications.filter(a => a.status === 'denied'));
  const allApps = filterBySearch(applications);
  const filteredPayments = filterBySearch(payments.map(p => ({ ...p, fullName: p.userName })));

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      denied: 'bg-red-100 text-red-800 border-red-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const tabs: { key: TabType; label: string; count: number; icon: any; color: string }[] = [
    { key: 'pending', label: 'Pending Review', count: applications.filter(a => a.status === 'pending').length, icon: Clock, color: 'text-amber-600' },
    { key: 'active', label: 'Active Loans', count: applications.filter(a => a.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-600' },
    { key: 'denied', label: 'Denied', count: applications.filter(a => a.status === 'denied').length, icon: XCircle, color: 'text-red-600' },
    { key: 'all', label: 'All Applications', count: applications.length, icon: FileText, color: 'text-blue-600' },
    { key: 'payments', label: 'Payment Tracking', count: payments.length, icon: CreditCard, color: 'text-purple-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500">Harvey's Loans LLC — 1-345-917-8564</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link to="/" className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <button type="button" onClick={handleSignOut} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Business Overview - 8 Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={TrendingUp} color="emerald" label="Loans Outstanding" value={`$${businessOverview.totalLoansOutstanding.toLocaleString()}`} />
          <MetricCard icon={DollarSign} color="blue" label="Principal Disbursed" value={`$${businessOverview.totalPrincipalDisbursed.toLocaleString()}`} />
          <MetricCard icon={AlertCircle} color="amber" label="Interest Accrued" value={`$${businessOverview.totalInterestAccrued.toLocaleString()}`} />
          <MetricCard icon={Activity} color="gray" label="Avg Loan Size" value={`$${businessOverview.averageLoanSize.toLocaleString()}`} />
          <MetricCard icon={CheckCircle} color="emerald" label="Active Loans" value={String(businessOverview.activeLoansCount)} />
          <MetricCard icon={Clock} color="amber" label="Pending Apps" value={String(businessOverview.pendingApplicationsCount)} />
          <MetricCard icon={XCircle} color="red" label="Denied Apps" value={String(businessOverview.deniedApplicationsCount)} />
          <MetricCard icon={FileText} color="indigo" label="Total Apps" value={String(businessOverview.totalApplicationsCount)} />
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-emerald-700 text-sm">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button type="button" title="Close error message" onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs + Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.key
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-indigo-600' : tab.color}`} />
                    {tab.label}
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone, ID..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="p-0">
            {activeTab === 'payments' ? (
              <PaymentsTable payments={filteredPayments as any} />
            ) : (
              <ApplicationsTable
                applications={
                  activeTab === 'pending' ? pendingApps :
                  activeTab === 'active' ? activeApps :
                  activeTab === 'denied' ? deniedApps :
                  allApps
                }
                activeTab={activeTab}
                getStatusBadge={getStatusBadge}
                onViewDetails={setSelectedApp}
              />
            )}
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => { setSelectedApp(null); setShowDenyForm(false); setError(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Loan Application Review</h2>
                <p className="text-indigo-200 text-sm">{selectedApp.applicationId || selectedApp.id}</p>
              </div>
              <button type="button" title="Close application details" onClick={() => { setSelectedApp(null); setShowDenyForm(false); setError(''); }} className="text-white/80 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Status */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadge(selectedApp.status)}`}>
                  {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500">Applied: {new Date(selectedApp.submittedAt || selectedApp.createdAt).toLocaleDateString()}</span>
                {selectedApp.approvedAt && <span className="text-sm text-emerald-600">Approved: {new Date(selectedApp.approvedAt).toLocaleDateString()}</span>}
                {selectedApp.deniedAt && <span className="text-sm text-red-600">Denied: {new Date(selectedApp.deniedAt).toLocaleDateString()}</span>}
              </div>

              {/* Applicant + Employment */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" /> Applicant Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Full Name</span><span className="font-medium text-gray-900">{selectedApp.fullName || selectedApp.userName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span><span className="font-medium text-gray-900">{selectedApp.userEmail}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span><span className="font-medium text-gray-900">{selectedApp.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</span><span className="font-medium text-gray-900 text-right">{selectedApp.address}, {selectedApp.city}, {selectedApp.state} {selectedApp.zipCode}</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-600" /> Employment</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Employer</span><span className="font-medium text-gray-900">{selectedApp.employer}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Job Title</span><span className="font-medium text-gray-900">{selectedApp.jobTitle}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Monthly Income</span><span className="font-medium text-gray-900">${parseFloat(selectedApp.monthlyIncome).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Years Employed</span><span className="font-medium text-gray-900">{selectedApp.employmentYears} years</span></div>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-indigo-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-indigo-600" /> Loan Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><p className="text-xs text-gray-500 uppercase">Requested</p><p className="text-xl font-bold text-gray-900">${Number(selectedApp.loanAmount).toLocaleString()}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Purpose</p><p className="text-sm font-medium text-gray-900">{selectedApp.loanPurpose}</p></div>
                  {selectedApp.status === 'approved' && (
                    <>
                      <div><p className="text-xs text-gray-500 uppercase">Current Balance</p><p className="text-xl font-bold text-emerald-700">${selectedApp.currentBalance.toLocaleString()}</p></div>
                      <div><p className="text-xs text-gray-500 uppercase">Total Paid</p><p className="text-xl font-bold text-blue-700">${selectedApp.totalPaid.toLocaleString()}</p></div>
                    </>
                  )}
                </div>
                {selectedApp.status === 'approved' && (
                  <div className="mt-3 grid grid-cols-3 gap-4 pt-3 border-t border-indigo-100">
                    <div><p className="text-xs text-gray-500">Interest Accrued</p><p className="text-sm font-semibold text-amber-700">${selectedApp.interestAccrued.toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500">Payments Made</p><p className="text-sm font-semibold text-gray-900">{selectedApp.paymentCount}</p></div>
                    <div><p className="text-xs text-gray-500">Remaining Balance</p><p className="text-sm font-semibold text-red-700">${selectedApp.remainingBalance.toLocaleString()}</p></div>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Documents</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">Employment Proof / Job Letter</span>
                    {selectedApp.employmentProofUrl ? (
                      <a href={selectedApp.employmentProofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"><Eye className="w-4 h-4" /> View</a>
                    ) : (<span className="text-xs text-gray-400">Not uploaded</span>)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">ID Verification</span>
                    {selectedApp.idProofUrl ? (
                      <a href={selectedApp.idProofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"><Eye className="w-4 h-4" /> View</a>
                    ) : (<span className="text-xs text-gray-400">Not uploaded</span>)}
                  </div>
                </div>
              </div>

              {/* Denial reason */}
              {selectedApp.status === 'denied' && selectedApp.denialReason && (
                <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2"><XCircle className="w-5 h-5" /> Denial Reason</h3>
                  <p className="text-sm text-red-700">{selectedApp.denialReason}</p>
                </div>
              )}

              {/* Approve / Deny for pending */}
              {selectedApp.status === 'pending' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2"><ThumbsUp className="w-5 h-5" /> Approve Loan</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                        <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="30" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Months)</label>
                        <input type="number" value={termMonths} onChange={e => setTermMonths(e.target.value)} placeholder="12" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                      </div>
                    </div>
                    <button type="button" onClick={handleApprove} disabled={approving || !interestRate || !termMonths} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <ThumbsUp className="w-4 h-4" />{approving ? 'Approving...' : 'Approve Loan Application'}
                    </button>
                  </div>
                  <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                    {!showDenyForm ? (
                      <button type="button" onClick={() => setShowDenyForm(true)} className="w-full flex items-center justify-center gap-2 text-red-700 hover:text-red-800 font-medium py-2">
                        <ThumbsDown className="w-4 h-4" /> Deny This Application <ChevronDown className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                          <ThumbsDown className="w-5 h-5" /> Deny Application
                          <button type="button" title="Collapse deny form" onClick={() => setShowDenyForm(false)} className="ml-auto text-red-400 hover:text-red-600"><ChevronUp className="w-4 h-4" /></button>
                        </h3>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Denial Reason</label>
                          <textarea value={denialReason} onChange={e => setDenialReason(e.target.value)} placeholder="Provide a reason for denial..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm resize-none" />
                        </div>
                        <button type="button" onClick={handleDeny} disabled={denying} className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4" />{denying ? 'Denying...' : 'Confirm Denial'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedApp.status === 'approved' && (
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                  <p className="text-emerald-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    This loan has been approved and is currently active.
                    {selectedApp.loanId && <span className="text-sm text-emerald-600 ml-2">Loan ID: {selectedApp.loanId}</span>}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };
  const c = colors[color] || colors.gray;
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${c.bg} rounded-lg`}><Icon className={`w-5 h-5 ${c.text}`} /></div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ApplicationsTable({ applications, activeTab, getStatusBadge, onViewDetails }: {
  applications: EnrichedApplication[]; activeTab: TabType; getStatusBadge: (s: string) => string; onViewDetails: (a: EnrichedApplication) => void;
}) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No applications found</p>
        <p className="text-sm text-gray-400 mt-1">
          {activeTab === 'pending' ? 'No pending applications to review' : activeTab === 'active' ? 'No active loans yet' : activeTab === 'denied' ? 'No denied applications' : 'No applications match your search'}
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applicant</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Purpose</th>
            {(activeTab === 'active' || activeTab === 'all') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid</th>}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {applications.map(app => (
            <tr key={app.applicationId || app.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3"><div className="font-medium text-gray-900 text-sm">{app.fullName || app.userName}</div><div className="text-xs text-gray-500">{app.phone}</div></td>
              <td className="px-4 py-3"><div className="text-sm text-gray-700">{app.userEmail}</div></td>
              <td className="px-4 py-3">
                <div className="font-semibold text-gray-900 text-sm">${Number(app.loanAmount).toLocaleString()}</div>
                {app.status === 'approved' && <div className="text-xs text-emerald-600">Bal: ${app.currentBalance.toLocaleString()}</div>}
              </td>
              <td className="px-4 py-3"><div className="text-sm text-gray-600 max-w-[150px] truncate">{app.loanPurpose}</div></td>
              {(activeTab === 'active' || activeTab === 'all') && (
                <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900">${app.totalPaid.toLocaleString()}</div><div className="text-xs text-gray-500">{app.paymentCount} payment{app.paymentCount !== 1 ? 's' : ''}</div></td>
              )}
              <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge(app.status)}`}>{app.status}</span></td>
              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(app.submittedAt || app.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <button type="button" onClick={() => onViewDetails(app)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-16">
        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No payments recorded yet</p>
        <p className="text-sm text-gray-400 mt-1">Payments will appear here once borrowers make loan payments</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Borrower Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Borrower Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loan Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Application</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map(payment => (
            <tr key={payment.paymentId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3"><span className="text-sm font-mono text-gray-700">{payment.paymentId}</span></td>
              <td className="px-4 py-3"><div className="font-medium text-gray-900 text-sm">{payment.userName}</div></td>
              <td className="px-4 py-3"><div className="text-sm text-gray-700">{payment.userEmail}</div></td>
              <td className="px-4 py-3"><div className="font-semibold text-emerald-700 text-sm">${payment.amount.toLocaleString()}</div></td>
              <td className="px-4 py-3"><div className="text-sm text-gray-700">${Number(payment.loanAmount).toLocaleString()}</div></td>
              <td className="px-4 py-3"><span className="text-sm font-mono text-gray-600">{payment.applicationId}</span></td>
              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(payment.paidAt).toLocaleDateString()} {new Date(payment.paidAt).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}