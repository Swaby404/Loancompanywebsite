import { Shield, Zap } from 'lucide-react';
import logo from 'figma:asset/e91ed6d83f2690a79935309cf8f1610c8d4c98b8.png';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Harvey's Loans" className="h-12" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Fast & Easy Loans for Your Dreams
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get approved in minutes. Competitive rates. Transparent process. 
              Our Form AI Agent will assist you with getting the funds you need today.
            </p>
            {/* Form AI Agent Placeholder / Container */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500 text-sm text-center">
                [Form AI Agent Integration Placeholder]
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-12">
            <img 
              src={logo} 
              alt="Harvey's Loans" 
              className="w-full max-w-md"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Harvey's Loans?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Fast Approval</h4>
              <p className="text-gray-600">
                Get approved in as little as 15 minutes with our streamlined process
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Secure & Safe</h4>
              <p className="text-gray-600">
                Bank-level encryption to keep your personal information protected
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <img src={logo} alt="" className="w-12 h-12 object-contain" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Transparent Terms</h4>
              <p className="text-gray-600">
                No hidden fees. Clear terms. Know exactly what you're agreeing to
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Harvey's Loans" className="h-8" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <span className="text-gray-300">
                📞 1-345-917-8564
              </span>
              <span className="text-gray-300">
                ✉️ Harveysloansllc@outlook.com
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 Harvey's Loans. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
