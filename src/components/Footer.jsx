import { FaBalanceScale } from 'react-icons/fa';

export default function Footer () {
  return (
    <footer className="bg-slate-900 text-gray-300 py-20">

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">

        <div>
          <div className="flex items-center gap-3 mb-6 group cursor-default">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <FaBalanceScale className="text-yellow-400 text-sm" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tighter">
              CivikTrack
            </h2>
          </div>
          <p>
            Making governance transparent and accessible to all citizens.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Product</h3>
          <ul className="space-y-2">
            <li>Features</li>
            <li>How It Works</li>
            <li>FAQ</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            <li>About Us</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Legal</h3>
          <ul className="space-y-2">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>

      </div>

      <div className="border-t border-gray-700 mt-12 pt-6 text-center text-sm">
        © 2026 CivikTrack. All rights reserved.
      </div>

    </footer>
  );
}
