import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
