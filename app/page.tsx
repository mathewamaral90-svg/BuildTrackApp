import Link from 'next/link'

export default function Home() {
  return (
    <main className="home">
      <nav className="nav">
        <Link className="brand" href="/">BUILD<span>TRACK</span></Link>
        <div className="nav-links">
          <Link href="/dashboard">Garage</Link>
          <Link href="/login">Log in</Link>
          <Link className="btn btn-primary" href="/register">Create account</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">AUTOMOTIVE BUILD COMMUNITY</div>
        <h1>Build it.<br /><span>Track it.</span><br />Share it.</h1>
        <p>One place to document your car build, track parts and progress, manage your budget, and eventually connect with other builders.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary btn-large" href="/register">Start your garage →</Link>
          <Link className="btn btn-secondary btn-large" href="/login">I already have an account</Link>
        </div>
      </section>

      <section className="feature-grid">
        <Link href="/dashboard" className="feature">
          <div className="feature-icon">01</div>
          <h2>Your Garage</h2>
          <p>Create vehicles and keep every build in one place.</p>
          <strong>Open Garage →</strong>
        </Link>
        <Link href="/builds/new" className="feature">
          <div className="feature-icon">02</div>
          <h2>Build Tracking</h2>
          <p>Track progress, budget, parts, tasks, expenses and notes.</p>
          <strong>Add a Vehicle →</strong>
        </Link>
        <div className="feature">
          <div className="feature-icon">03</div>
          <h2>Community</h2>
          <p>The database is structured for profiles, follows, comments and build discussions. The social layer is the next development phase.</p>
          <strong>Coming next</strong>
        </div>
      </section>

      <section className="demo">
        <div>
          <div className="eyebrow">BUILDTRACK IS LIVE</div>
          <h2>Stop keeping your build list in your Notes app.</h2>
          <p>Create an account, add your vehicle and start building a real history of the project.</p>
        </div>
        <Link className="btn btn-primary" href="/register">Create my garage</Link>
      </section>
    </main>
  )
}
