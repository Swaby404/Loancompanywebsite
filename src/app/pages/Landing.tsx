import { Link } from 'react-router';
import { Shield, Zap } from 'lucide-react';
 

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             
          </div>
          <div className="flex gap-4">
            <Link 
              to="/signin" 
              className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Get Started
            </Link>
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
              Apply online and get the funds you need today.
            </p>
            <Link 
              to="/signup" 
              className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-lg shadow-lg"
            >
              Apply Now
            </Link>
          </div>
          <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-12">
            <img 
               
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
               
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <a href="tel:1-3459178564" className="text-gray-300 hover:text-white transition-colors">
                📞 1-345-917-8564
              </a>
              <a href="mailto:Harveysloansllc@outlook.com" className="text-gray-300 hover:text-white transition-colors">
                ✉️ Harveysloansllc@outlook.com
              </a>
              <Link to="/admin/login" className="text-gray-400 hover:text-gray-300 text-xs transition-colors">
                Admin Portal
              </Link>
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