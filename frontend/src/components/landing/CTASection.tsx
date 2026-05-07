import { Link } from "react-router-dom"
import Container from "../layout/Container"

const CTASection = () => {
  return (
    <section className="py-24">
      <Container>

        <div className="bg-violet-600 rounded-4xl p-14 text-center">

          <h2 className="text-5xl font-bold text-white">
            Your AI Stack Might Be Burning Cash
          </h2>

          <p className="mt-6 text-violet-100 text-lg">
            Find out in under 3 minutes.
          </p>

          <Link
            to="/audit"
            className="inline-block mt-10 bg-white text-black px-8 py-4 rounded-2xl font-semibold"
          >
            Run Free Audit
          </Link>

        </div>

      </Container>
    </section>
  )
}

export default CTASection