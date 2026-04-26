import {useState, useEffect} from 'react';
import {FaMapMarkerAlt} from 'react-icons/fa';

const features = [
  {
    icon: '⚡',
    title: 'Instant Submission',
    desc: 'Submit complaints quickly with our easy interface',
  },
  {
    icon: <FaMapMarkerAlt className="text-blue-600" />,
    title: 'Location Based',
    desc: 'Automatically route complaints to the right authority',
  },
  {
    icon: '📷',
    title: 'Media Attachments',
    desc: 'Upload images and videos as evidence',
  },
  {
    icon: '🔔',
    title: 'Real-time Updates',
    desc: 'Track progress instantly',
  },
  {
    icon: '📊',
    title: 'Smart Escalation',
    desc: 'Issues escalate automatically if unresolved',
  },
  {
    icon: '✅',
    title: '24/7 Available',
    desc: 'Always accessible to citizens',
  },
];

export default function Features () {
  /* Typing animation for word "Features" */

  const word = 'Features';
  const [typedWord, setTypedWord] = useState ('');

  useEffect (() => {
    let index = 0;

    const interval = setInterval (() => {
      setTypedWord (word.slice (0, index + 1));
      index++;

      if (index === word.length) clearInterval (interval);
    }, 80);

    return () => clearInterval (interval);
  }, []);

  /* Typing animation for description */

  const sentence = [
    'Everything',
    'you',
    'need',
    'to',
    'report',
    'issues',
    'and',
    'track',
    'resolution.',
  ];

  const [displayText, setDisplayText] = useState ('');

  useEffect (() => {
    let index = 0;

    const interval = setInterval (() => {
      setDisplayText (prev => prev + ' ' + sentence[index]);
      index++;

      if (index === sentence.length) clearInterval (interval);
    }, 140);

    return () => clearInterval (interval);
  }, []);

  return (
    <section id="features" className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        {/* HEADING */}

        <h2 className="text-6xl font-bold text-center leading-tight">

          Powerful{' '}

          <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 text-transparent bg-clip-text">
            {typedWord}
          </span>

          <br />

          for Better Governance

        </h2>

        {/* DESCRIPTION */}

        <p className="text-center mt-6 text-lg font-medium
          bg-gradient-to-r from-blue-600 to-green-500
          text-transparent bg-clip-text min-h-[32px]">
          {displayText}
        </p>

        {/* FEATURES GRID */}

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-10 mt-20">

          {features.map ((f, i) => (
            <div
              key={i}
              className="group border rounded-2xl p-8
              hover:bg-blue-50 hover:border-blue-200
              hover:shadow-2xl hover:-translate-y-3
              transition-all duration-300 cursor-pointer"
            >

              {/* ICON */}

              <div className="text-5xl jump-icon transition-all duration-300 group-hover:scale-125">
                {f.icon}
              </div>

              {/* TITLE */}

              <h3 className="text-xl font-semibold mt-6">
                {f.title}
              </h3>

              {/* DESCRIPTION */}

              <p className="text-gray-600 mt-3 leading-relaxed">
                {f.desc}
              </p>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}
