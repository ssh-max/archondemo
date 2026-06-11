import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import './Pricing.css'

/* ──────────────────────────────────────────────────────────────────────────
   Archon — Pricing page (renders inside PublicLayout; header/footer already
   provided). All styling lives in the co-located Pricing.css, scoped under
   `.arc-pricing` with `arc-*` namespaced classes.
   ────────────────────────────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" stroke="#F5A623" strokeWidth="1.5" />
      <path d="M4.5 8.2l2.3 2.4 4.2-4.8" stroke="#F5A623" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const FREE_FEATURES = [
  '3 architecture generations per month',
  'Full solution output — diagram, security, cost, IaC, roadmap',
  'Overview + full-detail diagrams',
  'Email support',
]

const PRO_FEATURES = [
  'Unlimited generations (fair use)',
  'Everything in Free, plus:',
  'Save & revisit projects (history)',
  'Export to PDF',
  'Priority generation & support',
]

const ENTERPRISE_FEATURES = [
  'Everything in Pro, plus:',
  'A solution architect engagement — work directly with an expert to validate and tailor your architecture',
  'Custom requirements review & cost estimation',
  'Team workspaces',
  'SSO, priority SLA, dedicated support',
]

type FormState = {
  name: string
  email: string
  company: string
  requirements: string
}

type FormErrors = {
  name?: string
  email?: string
}

const EMPTY_FORM: FormState = { name: '', email: '', company: '', requirements: '' }

export function Pricing() {
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors]       = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLElement>(null)

  function handleContactClick() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const next: FormErrors = {}
    if (!form.name.trim()) {
      next.name = 'Name is required.'
    }
    if (!form.email.trim()) {
      next.email = 'Work email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.'
    }

    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    // TODO: wire submission to Supabase enquiries table in the
    //       next step — currently UI-only, does not persist.
    setSubmitted(true)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  return (
    <div className="arc-pricing">

      {/* ── 1. HERO HEADING ─────────────────────────────────────────────── */}
      <div className="arc-pr-hero">
        <div className="arc-container">
          <p className="arc-eyebrow">Pricing</p>
          <h1 className="arc-section-title">Simple, transparent pricing</h1>
          <p className="arc-section-sub">
            Start free. Upgrade when you're ready to save, export, and scale.
          </p>
        </div>
      </div>

      {/* ── 2. TIER CARDS ───────────────────────────────────────────────── */}
      <section className="arc-section arc-section--tiers">
        <div className="arc-container">
          <div className="arc-tiers">

            {/* Free */}
            <div className="arc-tier">
              <h2 className="arc-tier-name">Free</h2>
              <p className="arc-tier-price">$0</p>
              <p className="arc-tier-period">per month</p>
              <ul className="arc-tier-features" aria-label="Free plan features">
                {FREE_FEATURES.map(f => (
                  <li key={f}><CheckIcon />{f}</li>
                ))}
              </ul>
              <div className="arc-tier-cta">
                <Link className="arc-btn arc-btn-outline" to={ROUTES.login}>
                  Get started
                </Link>
              </div>
            </div>

            {/* Pro — visually highlighted */}
            <div className="arc-tier arc-tier--pro">
              <span className="arc-tier-badge">Most popular</span>
              <h2 className="arc-tier-name">Pro</h2>
              <p className="arc-tier-price">$20</p>
              <p className="arc-tier-period">per month</p>
              <ul className="arc-tier-features" aria-label="Pro plan features">
                {PRO_FEATURES.map(f => (
                  <li key={f}><CheckIcon />{f}</li>
                ))}
              </ul>
              <div className="arc-tier-cta">
                <Link className="arc-btn arc-btn-primary" to={ROUTES.login}>
                  Get started
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="arc-tier arc-tier--enterprise">
              <h2 className="arc-tier-name">Enterprise</h2>
              <p className="arc-tier-price">Custom</p>
              <p className="arc-tier-period">Let's talk</p>
              <ul className="arc-tier-features" aria-label="Enterprise plan features">
                {ENTERPRISE_FEATURES.map(f => (
                  <li key={f}><CheckIcon />{f}</li>
                ))}
              </ul>
              <div className="arc-tier-cta">
                <button
                  type="button"
                  className="arc-btn arc-btn-outline"
                  onClick={handleContactClick}
                >
                  Contact us
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. ENTERPRISE ENQUIRY FORM ──────────────────────────────────── */}
      <section
        className="arc-section arc-section--enquiry"
        ref={formRef}
        id="enterprise-form"
      >
        <div className="arc-container">
          <div className="arc-enquiry-wrap">
            <p className="arc-eyebrow">Enterprise</p>
            <h2 className="arc-section-title">Talk to us about Enterprise</h2>
            <p className="arc-section-sub">
              Tell us about your team and requirements — we'll be in touch within one business day.
            </p>

            <div className="arc-enquiry-form">
              {submitted ? (
                <div className="arc-form-success" role="status">
                  <span className="arc-form-success-icon" aria-hidden="true">✓</span>
                  Thanks — we'll be in touch shortly.
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="arc-form-grid">

                    <div className="arc-field">
                      <label className="arc-field-label" htmlFor="enq-name">
                        Name
                        <span className="arc-field-required" aria-hidden="true"> *</span>
                      </label>
                      <input
                        id="enq-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        className={`arc-field-input${errors.name ? ' arc-field--error' : ''}`}
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        aria-required="true"
                        aria-describedby={errors.name ? 'enq-name-err' : undefined}
                      />
                      {errors.name && (
                        <p id="enq-name-err" className="arc-field-error" role="alert">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="arc-field">
                      <label className="arc-field-label" htmlFor="enq-email">
                        Work email
                        <span className="arc-field-required" aria-hidden="true"> *</span>
                      </label>
                      <input
                        id="enq-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className={`arc-field-input${errors.email ? ' arc-field--error' : ''}`}
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        aria-required="true"
                        aria-describedby={errors.email ? 'enq-email-err' : undefined}
                      />
                      {errors.email && (
                        <p id="enq-email-err" className="arc-field-error" role="alert">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="arc-field arc-field--full">
                      <label className="arc-field-label" htmlFor="enq-company">
                        Company
                      </label>
                      <input
                        id="enq-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        className="arc-field-input"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Your company"
                      />
                    </div>

                    <div className="arc-field arc-field--full">
                      <label className="arc-field-label" htmlFor="enq-requirements">
                        Requirements
                      </label>
                      <textarea
                        id="enq-requirements"
                        name="requirements"
                        className="arc-field-textarea"
                        value={form.requirements}
                        onChange={handleChange}
                        placeholder="Tell us about your team size, use case, compliance needs, or anything else relevant…"
                        rows={4}
                      />
                    </div>

                  </div>

                  <button type="submit" className="arc-btn arc-btn-primary">
                    Send enquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
