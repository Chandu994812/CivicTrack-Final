import {Link} from 'react-router-dom';
import {FaArrowRight, FaCheckCircle} from 'react-icons/fa';

export default function CTA () {
  return (
    <section id="about" className="py-24">

      <div className="max-w-5xl mx-auto px-6">

        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600
          text-white text-center rounded-3xl p-16
          hover:shadow-2xl transition duration-500">

          <h2 className="text-5xl font-bold
          bg-gradient-to-r from-white via-blue-100 to-purple-200
          text-transparent bg-clip-text">

            Ready to Make a Difference?

          </h2>

          <p className="mt-6 text-lg text-blue-100 max-w-3xl mx-auto">
            Join thousands of citizens making their communities better.
          </p>

          <div className="flex flex-wrap justify-center gap-10 mt-10">

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-sky-300 text-xl" />
              Zero Registration Fee
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-sky-300 text-xl" />
              Complete Privacy
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-sky-300 text-xl" />
              Quick Support
            </div>

          </div>

          <div className="flex justify-center mt-12">

            <Link to="/login">

              <button className="bg-white text-blue-600 px-10 py-4 rounded-xl
              font-semibold flex items-center gap-3
              hover:scale-105 hover:shadow-xl transition">

                Start Filing Your Complaint Now

                <FaArrowRight />

              </button>

            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}
