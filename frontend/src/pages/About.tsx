import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import './About.css'

/* ──────────────────────────────────────────────────────────────────────────
   Archon — About page (renders inside PublicLayout; header/footer already
   provided). All styling lives in the co-located About.css, scoped under
   `.arc-about` with `arc-*` namespaced classes. Mission/product focus.
   ────────────────────────────────────────────────────────────────────────── */

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: 'Grounded, not guessed',
    body: 'Recommendations are rooted in established cloud best practice, not improvised.',
  },
  {
    title: 'Defensible by design',
    body: 'Every solution includes its reasoning, alternatives considered, and costs — ready to present and defend.',
  },
  {
    title: 'Built to accelerate',
    body: 'From brief to board-ready in minutes, so you lead the conversation from day one.',
  },
]

export function About() {
  return (
    <div className="arc-about">

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <div className="arc-ab-hero">
        <div className="arc-container">
          <p className="arc-eyebrow">About</p>
          <h1 className="arc-section-title arc-ab-headline">
            Architecture expertise, made accessible.
          </h1>
          <p className="arc-ab-lede">
            Archon exists to close the gap between a client's needs and a
            credible cloud architecture. Designing enterprise systems — weighing
            trade-offs, security, compliance, and cost — has always demanded
            senior expertise and weeks of effort. Archon compresses that into
            minutes, so teams can lead every conversation with a costed,
            defensible solution already in hand.
          </p>
        </div>
      </div>

      {/* ── 2. WHAT WE DO ────────────────────────────────────────────────── */}
      <section className="arc-section arc-section--what">
        <div className="arc-container">
          <p className="arc-eyebrow">What we do</p>
          <h2 className="arc-section-title">An AI-powered architecture advisor</h2>
          <p className="arc-section-sub arc-ab-what-body">
            Archon is an AI-powered architecture advisor built on Claude and
            grounded in cloud best practice. From a plain-English brief it
            produces a full solution: architecture diagrams, security posture,
            cost estimates, an IaC starter, and a delivery roadmap — Azure-native
            today, with more to come.
          </p>
        </div>
      </section>

      {/* ── 3. PRINCIPLES ────────────────────────────────────────────────── */}
      <section className="arc-section arc-section--principles">
        <div className="arc-container">
          <p className="arc-eyebrow">Principles</p>
          <h2 className="arc-section-title">What we hold to</h2>
          <div className="arc-ab-cards">
            {PRINCIPLES.map(p => (
              <article className="arc-ab-card" key={p.title}>
                <h3 className="arc-ab-card-title">{p.title}</h3>
                <p className="arc-ab-card-body">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. CLOSING CTA ───────────────────────────────────────────────── */}
      <section className="arc-section arc-ab-cta">
        <div className="arc-container">
          <div className="arc-ab-cta-inner">
            <p className="arc-ab-cta-line">See what Archon can do.</p>
            <Link className="arc-btn arc-btn-primary arc-ab-cta-btn" to={ROUTES.login}>
              Get started
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
