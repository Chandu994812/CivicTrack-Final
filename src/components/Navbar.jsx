import {Link} from 'react-router-dom';
import { FaBalanceScale } from 'react-icons/fa';

export default function Navbar () {
  return (
    <nav className="w-full border-b bg-white sticky top-0 z-50">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo */}

        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
            <FaBalanceScale className="text-yellow-400 text-xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
            CivikTrack
          </h1>
        </Link>

        {/* Menu */}

        <div className="hidden md:flex gap-10 text-gray-600 font-medium">

          <a href="#features" className="hover:text-blue-600 transition">
            Features
          </a>

          <a href="#howitworks" className="hover:text-blue-600 transition">
            How It Works
          </a>

          <a href="#about" className="hover:text-blue-600 transition">
            About
          </a>

        </div>

        {/* Buttons */}

        <div className="flex gap-4">

          <Link to="/login">
            <button className="border border-blue-300 px-5 py-2 rounded-full hover:bg-blue-50 transition">
              Sign In
            </button>
          </Link>

          <Link to="/login">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
              Raise Complaint
            </button>
          </Link>

        </div>

      </div>

    </nav>
  );
}
