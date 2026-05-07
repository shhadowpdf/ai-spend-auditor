import Container from "./Container"

const Footer = () => {
  return (
    <footer className="border-t border-zinc-900 py-10">
      <Container>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-zinc-500">
            Audit
          </p>

          <div className="flex items-center gap-6 text-zinc-500">
            <a href="#">GitHub</a>
            <a href="#">Privacy</a>
            <a href="#">Contact</a>
          </div>

        </div>

      </Container>
    </footer>
  )
}

export default Footer