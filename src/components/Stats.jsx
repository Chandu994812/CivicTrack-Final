export default function Stats () {
  const stats = [
    {
      icon: '✅',
      value: '50K+',
      label: 'Complaints Resolved',
    },
    {
      icon: '😊',
      value: '98%',
      label: 'Satisfaction Rate',
    },
    {
      icon: '⚡',
      value: '24hrs',
      label: 'Avg Resolution Time',
    },
    {
      icon: '🌍',
      value: '50+',
      label: 'Districts Connected',
    },
  ];

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10 text-center">

        {stats.map ((stat, i) => (
          <div
            key={i}
            className="group cursor-pointer transition-all duration-300"
          >

            {/* EMOJI */}

            <div className="text-4xl transition-all duration-300 group-hover:animate-bounce">
              {stat.icon}
            </div>

            {/* NUMBER */}

            <h3 className="text-5xl font-bold mt-4
              transition-transform duration-300
              group-hover:scale-110">
              {stat.value}
            </h3>

            {/* LABEL */}

            <p className="mt-2 text-blue-100
              transition-transform duration-300
              group-hover:scale-110">
              {stat.label}
            </p>

          </div>
        ))}

      </div>

    </section>
  );
}
