import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Zap, ShieldCheck } from 'lucide-react';
import HowToUseModal from '../components/HowToUseModal';

const HowToUse = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50/60 text-black font-sans selection:bg-black selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 py-3.5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="text-xl font-black tracking-tight text-black">
              VOLNXT
            </Link>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <Link 
              to="/" 
              className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black transition"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Home
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to={user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard'}
                className="bg-black hover:bg-gray-900 text-white px-3.5 py-1.5 rounded-full font-bold transition text-xs shadow-sm"
              >
                Dashboard ({user.name?.split(' ')[0]})
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-black font-bold hover:text-gray-600 transition text-xs px-3 py-1.5"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 md:p-8 flex flex-col justify-center">
        <HowToUseModal isStandalonePage={true} user={user} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} VOLNXT Inc. Next-Generation Mobile EV Charging Network.</p>
      </footer>
    </div>
  );
};

export default HowToUse;
