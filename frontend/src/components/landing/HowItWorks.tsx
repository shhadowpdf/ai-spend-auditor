import Container from "../layout/Container"

const steps = [
  "Add your AI tools",
  "Analyze spending patterns",
  "Get optimization recommendations"
]

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-24"
    >
      <Container>

        <div className="text-center mb-16">

          <h2 className="text-4xl font-bold text-white">
            How It Works
          </h2>

          <p className="mt-4 text-zinc-400">
            Audit your AI stack in under 3 minutes.
          </p>

        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {steps.map((step, index) => (
            <div
              key={step}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8"
            >

              <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
                {index + 1}
              </div>

              <h3 className="mt-6 text-2xl font-semibold text-white">
                {step}
              </h3>

            </div>
          ))}

        </div>

      </Container>
    </section>
  )
}

export default HowItWorks