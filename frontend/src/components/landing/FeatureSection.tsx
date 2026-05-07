import Container from "../layout/Container"

const features = [
  {
    title: "Detect Wasted Spend",
    description:
      "Identify overlapping subscriptions and overpriced plans instantly."
  },
  {
    title: "Smart Recommendations",
    description:
      "Get actionable cost-saving suggestions tailored to your workflow."
  },
  {
    title: "Shareable Reports",
    description:
      "Generate beautiful audit reports your team can review together."
  }
]

const FeatureSection = () => {
  return (
    <section
      id="features"
      className="py-24 border-t border-zinc-900"
    >
      <Container>

        <div className="text-center mb-16">

          <h2 className="text-4xl font-bold text-white">
            Built For AI-First Teams
          </h2>

          <p className="mt-4 text-zinc-400">
            Understand exactly where your AI budget is going.
          </p>

        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8"
            >
              <h3 className="text-2xl font-semibold text-white">
                {feature.title}
              </h3>

              <p className="mt-4 text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}

        </div>

      </Container>
    </section>
  )
}

export default FeatureSection