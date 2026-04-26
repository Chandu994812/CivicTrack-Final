import {useState} from 'react';
import {FaArrowRight} from 'react-icons/fa';

const steps = [
  {
    num: '1',
    icon: '👤',
    title: 'Register & Login',
    desc: 'Create your account as a citizen or authority member.',
  },
  {
    num: '2',
    icon: '📝',
    title: 'File Complaint',
    desc: 'Report the issue with details, location, and supporting images.',
  },
  {
    num: '3',
    icon: '👁️',
    title: 'Track Progress',
    desc: 'Monitor your complaint status in real-time with live updates.',
  },
  {
    num: '4',
    icon: '✨',
    title: 'Get Resolution',
    desc: 'Receive confirmation once your issue has been resolved.',
  },
];

export default function HowItWorks () {
  const [hovered, setHovered] = useState (null);

  return (
    <section id="howitworks" className="py-24 bg-gray-50">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <h2 className="text-5xl font-bold text-center
bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
text-transparent bg-clip-text tracking-wide">

          How It Works

        </h2>

        <p className="text-gray-600 text-center mt-4">
          A simple four-step process to resolve your local issues.
        </p>

        {/* Steps */}

        <div className="grid md:grid-cols-4 gap-8 mt-16 relative">

          {steps.map ((step, i) => (
            <div key={i} className="relative">

              {/* Arrow */}

              {i !== steps.length - 1 &&
                <div
                  className={`hidden md:block absolute top-1/2 -right-8 text-5xl font-bold transition
                  ${hovered === i ? 'text-blue-500 scale-110' : 'text-gray-300'}`}
                >
                  →
                </div>}

              {/* Card */}

              <div
                onMouseEnter={() => setHovered (i)}
                onMouseLeave={() => setHovered (null)}
                className={`border rounded-2xl p-8 text-center cursor-pointer
                transition-all duration-300
                ${hovered === i ? 'border-blue-500 shadow-xl -translate-y-2' : 'border-gray-200'}`}
              >

                {/* Number */}

                <div
                  className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center font-bold text-white transition-all duration-300
                  ${hovered === i ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-blue-500'}`}
                >
                  {step.num}
                </div>

                {/* Icon */}

                <div
                  className={`text-4xl mt-6 transition-all duration-300
                  ${hovered === i ? 'animate-bounce scale-110' : ''}`}
                >
                  {step.icon}
                </div>

                {/* Title */}

                <h3
                  className={`text-xl font-semibold mt-4 transition
                  ${hovered === i ? 'text-blue-600' : ''}`}
                >
                  {step.title}
                </h3>

                {/* Description */}

                <p className="text-gray-600 mt-2">
                  {step.desc}
                </p>

              </div>

            </div>
          ))}

        </div>

        {/* CTA Button */}

        <div className="flex justify-center mt-20">

          <button className="bg-gradient-to-r from-blue-600 to-green-500
            text-white px-10 py-4 rounded-xl text-lg font-semibold
            flex items-center gap-3
            hover:scale-105 transition">
            Start Filing Your Complaint Now
            <FaArrowRight />
          </button>

        </div>

      </div>

    </section>
  );
}
