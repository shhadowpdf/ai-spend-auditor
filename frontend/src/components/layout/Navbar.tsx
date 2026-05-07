import { Link } from "react-router-dom"
import Container from "./Container"

const Navbar = () => {
  return (
    <nav className="border-b border-zinc-800 py-4 sticky top-0 bg-black/80 backdrop-blur-md z-50">
      <Container>
        <div className="flex items-center justify-between">
          
          <Link
            to="/"
            className="text-2xl font-bold text-white"
          >
            Audit
          </Link>

          <div className="hidden md:flex items-center gap-8 text-zinc-300">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>

          <Link
            to="/audit"
            className="bg-violet-600 hover:bg-violet-500 px-5 py-2 rounded-xl text-white font-medium transition"
          >
            Start Audit
          </Link>
        </div>
      </Container>
    </nav>
  )
}

export default Navbar