import {FaRoad, FaWater, FaTrash, FaBolt} from 'react-icons/fa';

export default function Hero () {
  return (
    <section className="bg-gray-50 py-20">

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT CONTENT */}

        <div>

          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
            ✨ Smart Complaint Management
          </span>

          <h1 className="text-6xl font-bold mt-6 leading-tight">
            Your Voice,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-green-500 text-transparent bg-clip-text">
              Our Action
            </span>
          </h1>

          <p className="mt-6 text-gray-600 text-lg">
            Report local issues like damaged roads, water supply problems,
            sanitation issues, and electricity failures.
          </p>

          <ul className="mt-6 space-y-2 text-gray-700">
            <li>✅ Fast & Easy Complaint Submission</li>
            <li>✅ Real-time Status Tracking</li>
            <li>✅ Automatic Escalation System</li>
          </ul>

          <div className="mt-8 flex gap-4 flex-wrap">

            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition">
              Raise Complaint →
            </button>

            <button className="border px-8 py-3 rounded-xl hover:bg-gray-100 transition">
              Learn More
            </button>

          </div>

        </div>

        {/* RIGHT SIDE VISUAL */}

        <div className="relative bg-blue-50 rounded-3xl h-[420px] flex items-center justify-center">

          {/* ROAD ISSUE */}

          <div className="absolute top-16 left-12 bg-white p-5 rounded-xl shadow-md
          hover:shadow-xl hover:-translate-y-2 hover:bg-blue-100
          transition duration-300 flex items-center gap-3 cursor-pointer">

            <FaRoad className="text-orange-500 text-2xl" />
            <div>
              <h4 className="font-semibold">Road Issues</h4>
              <p className="text-sm text-gray-500">Report damages</p>
            </div>

          </div>

          {/* WATER ISSUE */}

          <div className="absolute bottom-20 right-10 bg-white p-5 rounded-xl shadow-md
          hover:shadow-xl hover:-translate-y-2 hover:bg-blue-100
          transition duration-300 flex items-center gap-3 cursor-pointer">

            <FaWater className="text-blue-500 text-2xl" />
            <div>
              <h4 className="font-semibold">Water Supply</h4>
              <p className="text-sm text-gray-500">Leaks & outages</p>
            </div>

          </div>

          {/* SANITATION */}

          <div className="absolute bottom-16 left-24 bg-white p-5 rounded-xl shadow-md
          hover:shadow-xl hover:-translate-y-2 hover:bg-green-100
          transition duration-300 flex items-center gap-3 cursor-pointer">

            <FaTrash className="text-green-500 text-2xl" />
            <div>
              <h4 className="font-semibold">Sanitation</h4>
              <p className="text-sm text-gray-500">Garbage issues</p>
            </div>

          </div>

          {/* ELECTRICITY */}

          <div className="absolute top-24 right-16 bg-white p-5 rounded-xl shadow-md
          hover:shadow-xl hover:-translate-y-2 hover:bg-yellow-100
          transition duration-300 flex items-center gap-3 cursor-pointer">

            <FaBolt className="text-yellow-500 text-2xl" />
            <div>
              <h4 className="font-semibold">Electricity</h4>
              <p className="text-sm text-gray-500">Power failures</p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

// Heading
// Description
// Buttons
// Image
