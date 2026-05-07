import { Link } from "react-router-dom"
import Container from "../layout/Container"

const Hero = () => {
  return (
    <section className="py-24">
      <Container>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-6">
              AI Spend Optimization Platform
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-white">
              Stop Overpaying
              <br />
              For AI Tools
            </h1>
            <p className="mt-6 text-zinc-400 text-lg leading-relaxed max-w-xl">
              Discover duplicate subscriptions, overpriced plans, and hidden AI spending leaks across your stack.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">

              <Link
                to="/audit"
                className="bg-violet-600 hover:bg-violet-500 px-7 py-4 rounded-2xl font-semibold text-white transition"
              >
                Start Free Audit
              </Link>

              <button className="border border-zinc-700 hover:border-zinc-500 px-7 py-4 rounded-2xl text-zinc-300 transition">
                View Sample Report
              </button>
            </div>

            <p className="mt-6 text-sm text-zinc-500">
              Supports ChatGPT, Claude, Gemini, Cursor,
              Copilot & more
            </p>

          </div>

          {/* RIGHT */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">

            <div className="space-y-6">

              <div className="bg-black rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  Monthly AI Spend
                </p>

                <h2 className="text-4xl font-bold text-white mt-2">
                  $2,480
                </h2>
              </div>

              <div className="bg-violet-500/10 rounded-2xl p-6 border border-violet-500/20">
                <p className="text-violet-300 text-sm">
                  Potential Savings
                </p>

                <h2 className="text-4xl font-bold text-white mt-2">
                  $720/mo
                </h2>
              </div>

              <div className="bg-black rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-400 text-sm mb-4">
                  Recommendations
                </p>

                <ul className="space-y-3 text-zinc-300">
                  <li>• Downgrade ChatGPT Team</li>
                  <li>• Remove duplicate AI coding tools</li>
                  <li>• Consolidate API usage</li>
                </ul>
              </div>

            </div>

          </div>

        </div>

      </Container>
    </section>
  )
}

export default Hero