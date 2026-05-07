import Container from "../layout/Container"

const faqs = [
  {
    question: "What AI tools are supported?",
    answer:
      "We support ChatGPT, Claude, Gemini, Cursor, Copilot, and more."
  },
  {
    question: "How accurate are recommendations?",
    answer:
      "Recommendations are based on current pricing and usage-fit rules."
  },
  {
    question: "Do I need billing access?",
    answer:
      "No. You manually enter your AI subscriptions and spend."
  }
]

const FAQ = () => {
  return (
    <section
      id="faq"
      className="py-24"
    >
      <Container>

        <div className="text-center mb-16">

          <h2 className="text-4xl font-bold text-white">
            Frequently Asked Questions
          </h2>

        </div>

        <div className="max-w-3xl mx-auto space-y-6">

          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <h3 className="text-white font-semibold text-lg">
                {faq.question}
              </h3>

              <p className="mt-3 text-zinc-400">
                {faq.answer}
              </p>
            </div>
          ))}

        </div>

      </Container>
    </section>
  )
}

export default FAQ