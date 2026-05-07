import Container from "../layout/Container"

const SavingsPreview = () => {
  return (
    <section className="py-24">
      <Container>

        <div className="bg-zinc-900 border border-zinc-800 rounded-4xl p-10">

          <div className="max-w-2xl">

            <h2 className="text-4xl font-bold text-white">
              Example Savings Breakdown
            </h2>

            <p className="mt-4 text-zinc-400">
              See how teams reduce unnecessary AI costs.
            </p>

          </div>

          <div className="mt-12 grid gap-6">

            <div className="bg-black border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">

              <div>
                <p className="text-white font-semibold">
                  ChatGPT Team
                </p>

                <p className="text-zinc-500">
                  Current spend: $25/user
                </p>
              </div>

              <div className="text-right">
                <p className="text-violet-300">
                  Switch to Plus
                </p>

                <p className="text-green-400 font-semibold">
                  Save $240/year
                </p>
              </div>

            </div>

          </div>

        </div>

      </Container>
    </section>
  )
}

export default SavingsPreview