import React, { useState, useRef, useEffect } from 'react'
import type { AdvisorFormState } from '../types'
import {
  COLOR_PRIMARY,
  COLOR_PRIMARY_HOVER,
  COLOR_BG_BASE,
  COLOR_BG_SURFACE,
  COLOR_BG_OVERLAY,
  COLOR_BORDER,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_DANGER,
  COLOR_SUCCESS_BG,
  COLOR_SUCCESS_TEXT,
  COLOR_INFO_BG,
  COLOR_INFO_TEXT,
  COLOR_INFO_TEXT_MUTED,
  COLOR_TEMPLATE_ACTIVE,
} from '../tokens'

const SS: React.CSSProperties = {
  fontFamily: '"Segoe UI", system-ui, sans-serif',
}

type AdvisorPanelProps = {
  advisorForm: AdvisorFormState
  updAdvisor: (field: keyof AdvisorFormState, value: any) => void
  advisorSolution: any | null
  generateAdvisor: (changeDescription?: string, requirements?: string) => void
  collapseRef?: React.MutableRefObject<(() => void) | null>
}

// ── Local dark-themed form helpers ─────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '6px 9px',
  border: `1px solid ${COLOR_BORDER}`, borderRadius: 6,
  fontSize: 11, color: COLOR_TEXT_PRIMARY, background: COLOR_BG_BASE,
  ...SS, outline: 'none', boxSizing: 'border-box',
}

function FL({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        fontSize: 10, fontWeight: 500, color: COLOR_TEXT_SECONDARY,
        display: 'block', marginBottom: 3, ...SS,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Sel({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inp, cursor: 'pointer', ...SS }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

function Chips({ opts, val, onToggle }: {
  opts: string[]; val: string[]; onToggle: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {opts.map(o => (
        <button key={o} onClick={() => onToggle(o)}
          style={{
            fontSize: 10, padding: '3px 8px', border: '1px solid',
            borderRadius: 99,
            borderColor: val.includes(o) ? COLOR_PRIMARY : COLOR_BORDER,
            background: val.includes(o) ? COLOR_PRIMARY : COLOR_BG_SURFACE,
            color: val.includes(o) ? '#fff' : COLOR_TEXT_SECONDARY,
            cursor: 'pointer', ...SS,
          }}>
          {o}
        </button>
      ))}
    </div>
  )
}

// ── Constants ──────────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  'B2B SaaS for enterprise CTOs to generate AI-powered architecture designs. 200 concurrent users, Azure, SOC2 + GDPR, $10k/month budget, Australia East. Integrates with Claude API, Stripe, Slack, WorkOS.',
  'E-commerce marketplace for Australia with 10,000 daily orders. PCI-DSS compliance required. Real-time inventory across 50 warehouses, personalisation engine, and seller portal.',
  'Internal data platform consolidating 15 source systems into a lakehouse. 100 analyst users, dbt transformations, Power BI dashboards, row-level security per business unit. Azure, advanced team, $30k/month.',
  'Healthcare SaaS for clinical decision support. HIPAA and SOC2 required. Integrates with Epic EHR via HL7 FHIR. 500 clinician users, 99.95% SLA, PHI must never leave Australia East.',
  'Supply chain visibility platform. Real-time tracking of 50,000 shipments, EDI integration with 200 trading partners, SAP for ERP postings, 99.9% SLA, $25k/month Azure budget.',
  'Developer platform SaaS: CI/CD pipelines, container registry, infrastructure provisioning. 5,000 developer users, multi-region, 99.99% SLA, GitHub and Terraform integrations, ISO 27001.',
  'Financial services platform for trade settlement and reporting. SOC2, PCI-DSS, APRA CPS 234. 1,000 concurrent users, real-time event processing, 99.99% SLA, SWIFT integration.',
  'IoT platform ingesting telemetry from 500,000 connected devices. Azure IoT Hub, stream processing, time-series storage, anomaly detection ML, operator dashboard, $50k/month.',
  'Multi-tenant HR SaaS for leave management and payroll integration. 10,000 employees across 50 tenants, GDPR and Australian Fair Work Act, Xero and MYOB payroll integrations.',
]

const TEMPLATES = [
  {
    name: 'B2B SaaS',
    form: {
      project_type: 'B2B SaaS',
      concurrent_users: '100-500',
      requests_per_day: '10k-100k',
      cloud_preference: ['Azure'],
      compliance_requirements: ['SOC2', 'GDPR'],
      team_size: '4-10',
      cloud_maturity: 'Intermediate',
      budget_range: '$5k-$25k',
      availability_sla: '99.9%',
      primary_concern: 'Security',
      region_preference: 'Australia East',
      integrations: 'Anthropic Claude API, Stripe, Slack, GitHub, Notion, WorkOS',
    },
    what: 'AI-powered cloud architecture advisory platform generating solution designs from structured user requirements',
    who: 'CTOs and enterprise architects at mid-market companies who need fast architecture decisions',
    special: 'Multi-tenant org isolation, usage-based billing via Stripe, SSO via WorkOS, Claude API with circuit-breaker pattern',
  },
  {
    name: 'E-commerce',
    form: {
      project_type: 'B2B SaaS',
      concurrent_users: '500-2000',
      requests_per_day: '100k+',
      cloud_preference: ['Azure'],
      compliance_requirements: ['PCI-DSS', 'GDPR'],
      team_size: '10-30',
      cloud_maturity: 'Intermediate',
      budget_range: '$25k-$100k',
      availability_sla: '99.95%',
      primary_concern: 'Performance',
      region_preference: 'Australia East',
      integrations: 'Stripe, SendGrid, Elasticsearch, Shopify APIs',
    },
    what: 'Multi-vendor e-commerce platform with product catalogue, cart, checkout, and order management',
    who: 'End consumers purchasing online and vendors managing inventory via a seller portal',
    special: 'PCI-DSS scoped checkout, real-time inventory sync across 50 warehouses, personalisation engine',
  },
  {
    name: 'Data Platform',
    form: {
      project_type: 'Internal Platform',
      concurrent_users: '100-500',
      requests_per_day: '1k-10k',
      cloud_preference: ['Azure'],
      compliance_requirements: ['GDPR', 'ISO 27001'],
      team_size: '4-10',
      cloud_maturity: 'Advanced',
      budget_range: '$25k-$100k',
      availability_sla: '99.9%',
      primary_concern: 'Scalability',
      region_preference: 'Australia East',
      integrations: 'Salesforce, SAP, Power BI, dbt Cloud, Azure DevOps',
    },
    what: 'Centralised data lakehouse ingesting from 10+ source systems with real-time and batch pipelines',
    who: 'Data analysts, scientists, and BI consumers across the organisation',
    special: 'Row-level security per business unit, data lineage tracking, ML feature store, dbt transformation layer',
  },
  {
    name: 'Internal Tool',
    form: {
      project_type: 'Internal Platform',
      concurrent_users: '100-500',
      requests_per_day: '1k-10k',
      cloud_preference: ['Azure'],
      compliance_requirements: ['ISO 27001'],
      team_size: '4-10',
      cloud_maturity: 'Intermediate',
      budget_range: '$2k-$5k',
      availability_sla: '99%',
      primary_concern: 'Time-to-market',
      region_preference: 'Australia East',
      integrations: 'Microsoft 365, Teams, SharePoint, Jira',
    },
    what: 'Internal workflow automation for approvals, document management, and team task coordination',
    who: 'Internal employees across departments, no external user access',
    special: 'SSO via Entra ID, RBAC per department, full audit log, email and Teams notifications',
  },
  {
    name: 'Healthcare',
    form: {
      project_type: 'B2B SaaS',
      concurrent_users: '100-500',
      requests_per_day: '10k-100k',
      cloud_preference: ['Azure'],
      compliance_requirements: ['HIPAA', 'SOC2', 'ISO 27001'],
      team_size: '10-30',
      cloud_maturity: 'Advanced',
      budget_range: '$25k-$100k',
      availability_sla: '99.95%',
      primary_concern: 'Security',
      region_preference: 'Australia East',
      integrations: 'Epic EHR, Azure Health Data Services, Twilio, Stripe',
    },
    what: 'Clinical data management for patient records, appointment scheduling, and clinical decision support',
    who: 'Clinicians, nurses, and administrative staff at hospitals and clinics',
    special: 'HIPAA BAA required, PHI encryption everywhere, full audit trail, HL7 FHIR API for EHR integration',
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function AdvisorPanel({
  advisorForm,
  updAdvisor,
  advisorSolution,
  generateAdvisor,
  collapseRef,
}: AdvisorPanelProps) {
  const [mode, setMode] = useState<'chat' | 'form'>('chat')
  const [panelOpen, setPanelOpen] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState('B2B SaaS')
  const [chatInput, setChatInput] = useState('')
  const [functionalWhat, setFunctionalWhat] = useState('')
  const [functionalWho, setFunctionalWho] = useState('')
  const [functionalSpecial, setFunctionalSpecial] = useState('')
  const [showMoreExamples, setShowMoreExamples] = useState(false)
  const [prefillNotice, setPrefillNotice] = useState(false)
  const [toast, setToast] = useState(false)
  const [changeInput, setChangeInput] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const prefillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (collapseRef) {
      collapseRef.current = () => setPanelOpen(false)
    }
    return () => {
      if (collapseRef) collapseRef.current = null
    }
  }, [collapseRef])

  // ── helper functions ───────────────────────────────────────────────────

  function showToast() {
    setToast(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(false), 2000)
  }

  function buildChatReq(): string {
    return (
      'Extract the architecture requirements from the following plain English description ' +
      'and generate a complete solution document. Make reasonable assumptions for any missing ' +
      'details and state them explicitly in solution_overview.\n\n' +
      'Description: ' + chatInput.trim()
    )
  }

  function buildFormReq(): string {
    const parts: string[] = []
    if (functionalWhat.trim()) parts.push('What it does: ' + functionalWhat.trim())
    if (functionalWho.trim()) parts.push('Who uses it: ' + functionalWho.trim())
    if (functionalSpecial.trim()) parts.push('Key requirements: ' + functionalSpecial.trim())
    return parts.join('\n\n')
  }

  function handleGenerate() {
    const req = mode === 'chat' ? buildChatReq() : buildFormReq()
    updAdvisor('functional_requirements', req)
    generateAdvisor(undefined, req)
  }

  function handleAnalyse() {
    if (!changeInput.trim()) return
    generateAdvisor(changeInput.trim())
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setActiveTemplate(t.name)
    Object.entries(t.form).forEach(([k, v]) =>
      updAdvisor(k as keyof AdvisorFormState, v as any))
    setFunctionalWhat(t.what)
    setFunctionalWho(t.who)
    setFunctionalSpecial(t.special)
    showToast()
  }

  function switchMode(next: 'chat' | 'form') {
    if (next === 'form' && mode === 'chat' && chatInput.trim()) {
      setFunctionalWhat(chatInput.trim())
      setFunctionalWho('')
      setFunctionalSpecial('')
      const t = chatInput
      if (/azure/i.test(t)) updAdvisor('cloud_preference', ['Azure'])
      else if (/\baws\b/i.test(t)) updAdvisor('cloud_preference', ['AWS'])
      else if (/\bgcp\b/i.test(t)) updAdvisor('cloud_preference', ['GCP'])
      const compliance: string[] = []
      if (/gdpr/i.test(t)) compliance.push('GDPR')
      if (/soc\s*2/i.test(t)) compliance.push('SOC2')
      if (/hipaa/i.test(t)) compliance.push('HIPAA')
      if (/pci/i.test(t)) compliance.push('PCI-DSS')
      if (/iso\s*27001/i.test(t)) compliance.push('ISO 27001')
      if (compliance.length) updAdvisor('compliance_requirements', compliance)
      const bm = t.match(/\$(\d+)k/i)
      if (bm) {
        const k = parseInt(bm[1])
        updAdvisor('budget_range',
          k < 5 ? '$2k-$5k' : k < 25 ? '$5k-$25k' :
          k < 100 ? '$25k-$100k' : '$100k+')
      }
      setPrefillNotice(true)
      if (prefillTimerRef.current) clearTimeout(prefillTimerRef.current)
      prefillTimerRef.current = setTimeout(() => setPrefillNotice(false), 6000)
    }
    if (next === 'chat' && mode === 'form') {
      const parts: string[] = []
      if (functionalWhat.trim()) parts.push(functionalWhat.trim())
      if (functionalWho.trim()) parts.push('Users: ' + functionalWho.trim())
      if (functionalSpecial.trim()) parts.push('Key requirements: ' + functionalSpecial.trim())
      if (parts.length) setChatInput(parts.join('\n\n'))
    }
    setMode(next)
  }

  // ── shared style objects ───────────────────────────────────────────────

  const sectionLabel: React.CSSProperties = {
    ...SS, fontSize: 10, fontWeight: 500, color: COLOR_TEXT_SECONDARY,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 8, marginTop: 14, display: 'block',
  }
  const helper: React.CSSProperties = {
    ...SS, fontSize: 10, color: COLOR_TEXT_MUTED, marginTop: 3,
    lineHeight: 1.5, display: 'block',
  }
  const miniLabel: React.CSSProperties = {
    ...SS, fontSize: 10, color: COLOR_TEXT_SECONDARY, fontWeight: 500,
    marginBottom: 3, display: 'block',
  }
  const miniTextarea: React.CSSProperties = {
    ...SS, width: '100%', border: `1px solid ${COLOR_BORDER}`,
    borderRadius: 6, padding: '6px 8px', fontSize: 11,
    color: COLOR_TEXT_PRIMARY, background: COLOR_BG_BASE, resize: 'vertical',
    outline: 'none', minHeight: 52, lineHeight: 1.5,
    boxSizing: 'border-box',
  }
  const generateBtn: React.CSSProperties = {
    ...SS, width: '100%', padding: '9px 0', borderRadius: 8,
    background: COLOR_PRIMARY, color: '#fff', border: 'none',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    marginTop: 10, marginBottom: 14,
  }

  // ── chip toggle helper ─────────────────────────────────────────────────

  function toggleArr(field: 'cloud_preference' | 'compliance_requirements', val: string) {
    const arr = advisorForm[field] as string[]
    updAdvisor(field, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── PANEL ── */}
      <div style={{
        width: panelOpen ? 300 : 52,
        transition: 'width 350ms ease-in-out',
        flexShrink: 0, position: 'relative',
        background: COLOR_BG_BASE, borderRight: `1px solid ${COLOR_BG_OVERLAY}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        height: '100%',
      }}>

        {/* Chevron toggle tab */}
        <div
          onClick={() => setPanelOpen(p => !p)}
          style={{
            position: 'absolute', right: -12, top: '50%',
            transform: 'translateY(-50%)', width: 12, height: 36,
            background: COLOR_BG_SURFACE, border: `1px solid ${COLOR_BG_OVERLAY}`,
            borderLeft: 'none', borderRadius: '0 6px 6px 0',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10, fontSize: 10,
            color: COLOR_TEXT_SECONDARY, userSelect: 'none',
          }}
        >
          {panelOpen ? '‹' : '›'}
        </div>

        {/* COLLAPSED STATE */}
        {!panelOpen && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16, padding: '16px 0',
            height: '100%',
          }}>
            {/* App icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: COLOR_PRIMARY, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, flexShrink: 0,
            }}>⬡</div>
            {/* Rotated template label */}
            <span style={{
              ...SS, writingMode: 'vertical-rl',
              transform: 'rotate(180deg)', fontSize: 10,
              color: COLOR_TEXT_SECONDARY, letterSpacing: '0.04em',
              flex: 1, textAlign: 'center',
            }}>
              {activeTemplate}
            </span>
            {/* Pencil re-open button */}
            <button
              onClick={() => setPanelOpen(true)}
              style={{
                background: 'none', border: 'none', color: COLOR_TEXT_SECONDARY,
                cursor: 'pointer', fontSize: 16, paddingBottom: 16,
                lineHeight: 1,
              }}
              title="Edit requirements"
            >✏</button>
          </div>
        )}

        {/* EXPANDED STATE */}
        {panelOpen && (
          <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            width: 300, overflow: 'hidden',
          }}>

            {/* Summary bar — only after generation */}
            {!!advisorSolution && (
              <div style={{
                background: COLOR_INFO_BG, padding: '10px 14px',
                borderBottom: `1px solid ${COLOR_BG_OVERLAY}`, flexShrink: 0,
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ ...SS, fontSize: 12, color: COLOR_INFO_TEXT, fontWeight: 500 }}>
                    Editing: {activeTemplate}
                  </div>
                  <div style={{ ...SS, fontSize: 10, color: COLOR_INFO_TEXT_MUTED, marginTop: 2 }}>
                    Regenerate to apply changes
                  </div>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  style={{
                    background: 'none', border: 'none', color: COLOR_INFO_TEXT_MUTED,
                    cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0,
                  }}
                >×</button>
              </div>
            )}

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0' }}>

              {/* App name — only before first generation */}
              {!advisorSolution && (
                <div style={{
                  ...SS, fontSize: 13, fontWeight: 500,
                  color: COLOR_TEXT_PRIMARY, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  ⬡ Archon
                  <span style={{ fontSize: 10, color: COLOR_TEXT_SECONDARY, fontWeight: 400 }}>
                    Enterprise Advisor
                  </span>
                </div>
              )}

              {/* Mode toggle */}
              <div style={{
                display: 'flex', background: COLOR_BG_SURFACE,
                borderRadius: 20, padding: 3, marginBottom: 14, gap: 2,
              }}>
                {(['chat', 'form'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    style={{
                      ...SS, flex: 1, padding: '5px 0', borderRadius: 16,
                      border: mode === m ? `1px solid ${COLOR_BORDER}` : 'none',
                      background: mode === m ? COLOR_BG_BASE : 'transparent',
                      color: mode === m ? COLOR_TEXT_PRIMARY : COLOR_TEXT_SECONDARY,
                      fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {m === 'chat' ? '💬 Describe it' : '📋 Fill form'}
                  </button>
                ))}
              </div>

              {/* ── CHAT MODE ── */}
              {mode === 'chat' && (
                <>
                  <span style={sectionLabel}>What are you building?</span>

                  <div style={{
                    background: COLOR_BG_BASE, border: `1px solid ${COLOR_BORDER}`,
                    borderRadius: 8, padding: 12, marginBottom: 8,
                  }}>
                    <textarea
                      style={{
                        ...SS, width: '100%', border: 'none',
                        background: 'transparent', fontSize: 12,
                        color: COLOR_TEXT_PRIMARY, resize: 'vertical', outline: 'none',
                        lineHeight: 1.6, minHeight: 140, boxSizing: 'border-box',
                      }}
                      placeholder={
                        "Describe what you're building in plain English...\n\n" +
                        "e.g. We're building a B2B SaaS platform for enterprise " +
                        "architects to generate cloud designs using AI. 500 concurrent " +
                        "users, GDPR compliance, SSO via WorkOS, $10k/month Azure budget."
                      }
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                    />
                  </div>

                  <span style={helper}>
                    No technical knowledge needed — describe your product, users,
                    scale, and constraints. Claude extracts the details.
                  </span>

                  {/* Example chips */}
                  <div style={{ marginTop: 12 }}>
                    <span style={{ ...SS, fontSize: 10, color: COLOR_TEXT_MUTED, display: 'block', marginBottom: 6 }}>
                      Or try an example →
                    </span>

                    {EXAMPLE_PROMPTS.slice(0, 3).map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(ex)}
                        style={{
                          ...SS, width: '100%',
                          padding: '6px 10px', borderRadius: 8,
                          border: `1px solid ${COLOR_BORDER}`, background: COLOR_BG_SURFACE,
                          fontSize: 10, color: COLOR_TEXT_SECONDARY, cursor: 'pointer',
                          lineHeight: 1.5, marginBottom: 5, fontStyle: 'italic',
                          textAlign: 'left',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        } as React.CSSProperties}
                        title={ex}
                      >
                        {ex}
                      </button>
                    ))}

                    {/* Expandable examples */}
                    <div style={{
                      maxHeight: showMoreExamples ? 600 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 300ms ease-in-out',
                    }}>
                      {EXAMPLE_PROMPTS.slice(3).map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setChatInput(ex)}
                          style={{
                            ...SS, display: 'block', width: '100%',
                            padding: '6px 10px', borderRadius: 8,
                            border: `1px solid ${COLOR_BORDER}`, background: COLOR_BG_SURFACE,
                            fontSize: 10, color: COLOR_TEXT_SECONDARY, cursor: 'pointer',
                            lineHeight: 1.5, marginBottom: 5, fontStyle: 'italic',
                            textAlign: 'left',
                          }}
                          title={ex}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowMoreExamples(p => !p)}
                      style={{
                        ...SS, fontSize: 11, color: COLOR_TEXT_MUTED, cursor: 'pointer',
                        textDecoration: 'underline', marginTop: 4,
                        display: 'block', background: 'none', border: 'none',
                        padding: 0,
                      }}
                    >
                      {showMoreExamples ? 'See less ↑' : 'See more ↓'}
                    </button>
                  </div>

                  <button style={generateBtn} onClick={handleGenerate}>
                    Generate Architecture →
                  </button>
                </>
              )}

              {/* ── FORM MODE ── */}
              {mode === 'form' && (
                <>
                  {/* Templates row */}
                  <span style={sectionLabel}>Start from a template →</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {TEMPLATES.map(t => (
                      <button
                        key={t.name}
                        onClick={() => applyTemplate(t)}
                        style={{
                          ...SS, padding: '4px 10px', borderRadius: 20,
                          border: activeTemplate === t.name
                            ? `2px solid ${COLOR_PRIMARY}` : `1px solid ${COLOR_BORDER}`,
                          background: COLOR_BG_SURFACE,
                          color: activeTemplate === t.name ? COLOR_TEMPLATE_ACTIVE : COLOR_TEXT_SECONDARY,
                          fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  {/* Pre-fill notice */}
                  {prefillNotice && (
                    <div style={{
                      background: COLOR_INFO_BG, border: '1px solid #1e3a5f',
                      borderRadius: 8, padding: '8px 10px', marginBottom: 12,
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}>
                      <span style={{ ...SS, fontSize: 11, color: COLOR_INFO_TEXT, lineHeight: 1.4, flex: 1 }}>
                        We've pre-filled what we could — review all fields before generating.
                      </span>
                      <button
                        onClick={() => setPrefillNotice(false)}
                        style={{
                          background: 'none', border: 'none', color: COLOR_INFO_TEXT_MUTED,
                          cursor: 'pointer', fontSize: 14, lineHeight: 1,
                          padding: '0 0 0 8px', flexShrink: 0,
                        }}
                      >×</button>
                    </div>
                  )}

                  {/* Existing dropdowns — copied verbatim from removed App.tsx form JSX */}
                  <FL label="Project type">
                    <Sel value={advisorForm.project_type}
                      onChange={v => updAdvisor('project_type', v)}
                      options={['B2B SaaS', 'Internal Platform', 'Data Platform', 'E-commerce', 'AI/ML Platform', 'IoT Platform']} />
                  </FL>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <FL label="Concurrent users">
                      <Sel value={advisorForm.concurrent_users}
                        onChange={v => updAdvisor('concurrent_users', v)}
                        options={['<100', '100-500', '500-2000', '2000-10000', '10000+']} />
                      <span style={helper}>Peak simultaneous sessions, not total users</span>
                    </FL>
                    <FL label="Requests / day">
                      <Sel value={advisorForm.requests_per_day}
                        onChange={v => updAdvisor('requests_per_day', v)}
                        options={['<1k', '1k-10k', '10k-100k', '100k+']} />
                      <span style={helper}>Include API calls, page loads, background jobs</span>
                    </FL>
                  </div>

                  <FL label="Cloud preference">
                    <Chips opts={['Azure', 'AWS', 'GCP', 'Cloud-agnostic']}
                      val={advisorForm.cloud_preference}
                      onToggle={v => toggleArr('cloud_preference', v)} />
                  </FL>

                  <FL label="Compliance requirements">
                    <Chips opts={['SOC2', 'GDPR', 'HIPAA', 'ISO 27001', 'PCI-DSS', 'None']}
                      val={advisorForm.compliance_requirements}
                      onToggle={v => toggleArr('compliance_requirements', v)} />
                    <span style={helper}>Select all — gates which services are recommended</span>
                  </FL>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <FL label="Team size">
                      <Sel value={advisorForm.team_size}
                        onChange={v => updAdvisor('team_size', v)}
                        options={['1-3', '4-10', '10-30', '30+']} />
                    </FL>
                    <FL label="Cloud maturity">
                      <Sel value={advisorForm.cloud_maturity}
                        onChange={v => updAdvisor('cloud_maturity', v)}
                        options={['Beginner', 'Intermediate', 'Advanced']} />
                      <span style={helper}>Beginner: managed | Intermediate: IaC | Advanced: GitOps</span>
                    </FL>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <FL label="Monthly budget">
                      <Sel value={advisorForm.budget_range}
                        onChange={v => updAdvisor('budget_range', v)}
                        options={['<$2k', '$2k-$5k', '$5k-$25k', '$25k-$100k', '$100k+']} />
                      <span style={helper}>Azure infra only — excludes dev costs and licensing</span>
                    </FL>
                    <FL label="Availability SLA">
                      <Sel value={advisorForm.availability_sla}
                        onChange={v => updAdvisor('availability_sla', v)}
                        options={['99%', '99.9%', '99.95%', '99.99%']} />
                      <span style={helper}>99% ≈ 7h/month · 99.9% ≈ 45min · 99.95% ≈ 22min</span>
                    </FL>
                  </div>

                  <FL label="Primary concern">
                    <Sel value={advisorForm.primary_concern}
                      onChange={v => updAdvisor('primary_concern', v)}
                      options={['Security', 'Cost', 'Performance', 'Time-to-market', 'Scalability']} />
                    <span style={helper}>Weights the trade-off decisions in generated architecture</span>
                  </FL>

                  <FL label="Preferred region">
                    <Sel value={advisorForm.region_preference}
                      onChange={v => updAdvisor('region_preference', v)}
                      options={['Australia East', 'East US 2', 'UK South', 'Southeast Asia', 'West Europe', 'Japan East']} />
                  </FL>

                  {/* Three-field container */}
                  <span style={sectionLabel}>What are you building?</span>
                  <div style={{
                    border: `1px solid ${COLOR_BORDER}`, borderRadius: 12,
                    padding: '12px', background: 'rgba(22,27,34,0.5)',
                    marginBottom: 12, display: 'flex',
                    flexDirection: 'column', gap: 10,
                  }}>
                    {[
                      {
                        key: 'what', label: 'What it does',
                        value: functionalWhat, set: setFunctionalWhat,
                        placeholder: 'e.g. A multi-tenant SaaS platform that generates cloud architecture designs using AI, with guided intake and exportable diagrams',
                        help: 'Core product in 1-2 sentences. What it does, not how.',
                      },
                      {
                        key: 'who', label: 'Who uses it',
                        value: functionalWho, set: setFunctionalWho,
                        placeholder: 'e.g. CTOs and enterprise architects at mid-market companies who need architecture decisions fast',
                        help: 'Primary user and their technical level.',
                      },
                      {
                        key: 'special', label: 'Key non-obvious requirements',
                        value: functionalSpecial, set: setFunctionalSpecial,
                        placeholder: 'e.g. Multi-tenant org isolation, usage-based billing, SSO via WorkOS, Claude API circuit-breaker fallback',
                        help: 'Compliance edge cases, integration constraints, architecture gotchas.',
                      },
                    ].map(f => (
                      <div key={f.key}>
                        <span style={miniLabel}>{f.label}</span>
                        <textarea
                          style={{
                            ...miniTextarea,
                            border: focusedField === f.key
                              ? `1px solid ${COLOR_PRIMARY}` : `1px solid ${COLOR_BORDER}`,
                          }}
                          value={f.value}
                          onChange={e => f.set(e.target.value)}
                          onFocus={() => setFocusedField(f.key)}
                          onBlur={() => setFocusedField(null)}
                          placeholder={f.placeholder}
                          rows={2}
                        />
                        <span style={helper}>{f.help}</span>
                      </div>
                    ))}
                  </div>

                  {/* Existing integrations — copied verbatim from removed App.tsx form JSX */}
                  <FL label="Existing integrations">
                    <textarea
                      value={advisorForm.integrations}
                      onChange={e => updAdvisor('integrations', e.target.value)}
                      rows={2}
                      style={{ ...inp, resize: 'vertical', lineHeight: 1.6, fontSize: 10 }}
                      placeholder="e.g. Salesforce, Stripe, Slack, GitHub"
                    />
                    <span style={helper}>Optional — list services this platform must connect to</span>
                  </FL>

                  <button style={generateBtn} onClick={handleGenerate}>
                    Generate Architecture →
                  </button>
                </>
              )}

              {/* ── CHANGE REQUEST — both modes, only after generation ── */}
              {!!advisorSolution && (
                <div style={{
                  borderTop: `1px solid ${COLOR_BG_OVERLAY}`,
                  paddingTop: 12, marginTop: 4,
                }}>
                  <span style={sectionLabel}>Request a change</span>
                  <textarea
                    style={{
                      ...SS, width: '100%', border: `1px solid ${COLOR_BORDER}`,
                      borderRadius: 8, padding: '8px 10px', fontSize: 11,
                      color: COLOR_TEXT_PRIMARY, background: COLOR_BG_BASE,
                      resize: 'vertical', outline: 'none',
                      minHeight: 52, marginBottom: 6, boxSizing: 'border-box',
                    }}
                    placeholder="e.g. Add multi-region DR to Southeast Asia, or switch from Container Apps to AKS for GPU workload support"
                    value={changeInput}
                    onChange={e => setChangeInput(e.target.value)}
                  />
                  <span style={helper}>
                    Claude analyses impact before applying any changes
                  </span>
                  <button
                    onClick={handleAnalyse}
                    style={{
                      ...SS, width: '100%', padding: '8px 0', borderRadius: 8,
                      background: COLOR_DANGER, color: '#fff', border: 'none',
                      fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      marginTop: 8,
                    }}
                  >
                    Analyse Impact
                  </button>
                  <span style={{
                    ...SS, fontSize: 10, color: COLOR_TEXT_MUTED, display: 'block',
                    textAlign: 'center', marginTop: 6,
                  }}>
                    You'll review risks and improvements before anything is applied
                  </span>
                </div>
              )}

              {/* Bottom padding */}
              <div style={{ height: 20 }} />
            </div>
          </div>
        )}
      </div>

      {/* ── FAB — fixed, only when panel collapsed ── */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          title="Edit requirements"
          style={{
            position: 'fixed', bottom: 24, left: 24, zIndex: 50,
            width: 48, height: 48, borderRadius: '50%',
            background: COLOR_PRIMARY, color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          ✏
        </button>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 50,
          background: COLOR_SUCCESS_BG, color: COLOR_SUCCESS_TEXT,
          padding: '7px 14px', borderRadius: 8,
          fontSize: 11, fontWeight: 500, ...SS,
        }}>
          Template applied ✓
        </div>
      )}
    </>
  )
}
